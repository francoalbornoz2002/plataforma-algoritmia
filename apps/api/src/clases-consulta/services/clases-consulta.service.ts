import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClasesConsultaDto } from '../dto/create-clases-consulta.dto';
import { UpdateClasesConsultaDto } from '../dto/update-clases-consulta.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ClaseConsulta,
  dias_semana,
  estado_clase_consulta,
  estado_consulta,
  Prisma,
  roles,
} from '@prisma/client';
import { getDiaSemanaEnum } from 'src/helpers';
import { FinalizarClaseDto } from '../dto/finalizar-clase.dto';
import {
  checkAlumnoAccess,
  checkDocenteAccess,
} from 'src/helpers/access.helper';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from 'src/mail/services/mail.service';
import { CancelarClaseDto } from '../dto/cancelar-clase.dto';

@Injectable()
export class ClasesConsultaService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Servicio para crear una clase de consulta.
   */
  async create(dto: CreateClasesConsultaDto, user: UserPayload) {
    const {
      idCurso,
      idDocente, // Docente a cargo (elegido)
      consultasIds, // Array de IDs de consultas
      fechaInicio,
      fechaFin,
      ...restDto // nombre, descripcion, modalidad
    } = dto;

    const dbFechaInicio = new Date(fechaInicio);
    const dbFechaFin = new Date(fechaFin);

    // 1. Validación básica de fechas
    if (dbFechaInicio >= dbFechaFin) {
      throw new BadRequestException(
        'La fecha/hora de fin debe ser mayor a la de inicio.',
      );
    }
    if (dbFechaInicio < new Date()) {
      throw new BadRequestException('No puedes crear una clase en el pasado.');
    }

    // Validar que no supere los 7 días
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 7);
    limitDate.setHours(23, 59, 59, 999); // Final del 7mo día
    if (dbFechaInicio > limitDate) {
      throw new BadRequestException(
        'La fecha de la clase no puede superar los 7 días desde hoy.',
      );
    }

    // Validar rango horario (08:00 - 21:00)
    this.validarRangoHorario(dbFechaInicio, dbFechaFin);

    // Validar superposición con otras clases de consulta
    const overlappingClase = await this.prisma.claseConsulta.findFirst({
      where: {
        idCurso: idCurso,
        deletedAt: null,
        fechaInicio: { lt: dbFechaFin },
        fechaFin: { gt: dbFechaInicio },
      },
    });

    if (overlappingClase) {
      throw new ConflictException(
        'El horario se solapa con otra clase de consulta ya programada para el mismo día.',
      );
    } // Validar que el nombre o la descripción no se repitan en otras clases
    const existingClase = await this.prisma.claseConsulta.findFirst({
      where: {
        OR: [{ nombre: restDto.nombre }, { descripcion: restDto.descripcion }],
      },
    });

    if (existingClase) {
      if (existingClase.nombre === restDto.nombre) {
        throw new ConflictException(
          'Ya existe una clase de consulta con ese nombre.',
        );
      }
      if (existingClase.descripcion === restDto.descripcion) {
        throw new ConflictException(
          'Ya existe una clase de consulta con esa descripción.',
        );
      }
    }

    // El 'user.userId' es el docente QUE ESTÁ CREANDO la clase
    const idDocenteCreador = user.userId;

    // --- Validación de superposición con horario de cursada ---

    await this.validarSuperposicionConClaseCurso(
      idCurso,
      dbFechaInicio,
      dbFechaFin,
    );
    // --------------------------------------------------------------

    try {
      // --- TRANSACCIÓN ---
      return await this.prisma.$transaction(async (tx: PrismaService) => {
        // --- 1. Validación de Seguridad ---

        // a. Validar que el docente creador pertenece al curso
        await checkDocenteAccess(tx, idDocenteCreador, idCurso);

        // b. Validar que el docente ELEGIDO (idDocente) pertenece al curso
        await checkDocenteAccess(tx, idDocente, idCurso);

        // c. Validar que TODAS las consultas estén 'Pendiente'
        const consultas = await tx.consulta.findMany({
          where: {
            id: { in: consultasIds },
            idCurso: idCurso, // Asegurarnos de que sean de este curso
          },
        });

        if (consultas.length !== consultasIds.length) {
          throw new BadRequestException(
            'Una o más consultas no se encontraron o no pertenecen a este curso.',
          );
        }

        const noPendientes = consultas.filter(
          (c) => c.estado !== estado_consulta.Pendiente,
        );
        if (noPendientes.length > 0) {
          throw new BadRequestException(
            'Solo puedes seleccionar consultas con estado "Pendiente".',
          );
        }

        // --- 2. Crear la Clase de Consulta ---
        const nuevaClase = await tx.claseConsulta.create({
          data: {
            ...restDto,
            idCurso,
            idDocente,
            fechaInicio: dbFechaInicio,
            fechaFin: dbFechaFin,
            estadoClase: estado_clase_consulta.Programada,
          },
        });

        // --- 3. Vincular las consultas a la clase (Tabla ConsultaClase) ---
        await tx.consultaClase.createMany({
          data: consultasIds.map((idConsulta) => ({
            idClaseConsulta: nuevaClase.id,
            idConsulta: idConsulta,
          })),
        });

        // --- 4. Actualizar el estado de esas consultas ---
        await tx.consulta.updateMany({
          where: { id: { in: consultasIds } },
          data: { estado: estado_consulta.A_revisar },
        });

        // --- NOTIFICACIÓN A ALUMNOS ---
        // Agrupamos las consultas por alumno para enviar un solo correo
        const consultasConAlumno = await tx.consulta.findMany({
          where: { id: { in: consultasIds } },
          include: { alumno: true },
        });

        const alumnosMap = new Map<
          string,
          { email: string; nombre: string; consultas: string[] }
        >();

        consultasConAlumno.forEach((c) => {
          if (!alumnosMap.has(c.idAlumno)) {
            alumnosMap.set(c.idAlumno, {
              email: c.alumno.email,
              nombre: c.alumno.nombre,
              consultas: [],
            });
          }
          alumnosMap.get(c.idAlumno)?.consultas.push(c.titulo);
        });

        const docente = await tx.usuario.findUnique({
          where: { id: idDocente },
          select: { nombre: true, apellido: true },
        });

        // Enviamos los correos (fuera del hilo principal si es posible, pero aquí es directo)
        // Usamos Array.from para iterar el Map
        const destinatarios = Array.from(alumnosMap.values());

        if (docente) {
          this.mailService.enviarAvisoClaseConsultaAlumno(destinatarios, {
            nombreClase: restDto.nombre,
            nombreDocente: `${docente.nombre} ${docente.apellido}`,
            fechaInicio: dbFechaInicio,
            modalidad: restDto.modalidad,
            idClase: nuevaClase.id,
          });
        }

        return nuevaClase;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error en ClasesConsultaService.create:', error);
      throw new InternalServerErrorException(
        'Error al crear la clase de consulta.',
      );
    }
  }

  /**
   * Servicio para obtener todas las clases de consulta de un curso.
   */
  async findAll(idCurso: string, user: UserPayload) {
    const idUsuario = user.userId;
    if (user.rol === roles.Docente) {
      await checkDocenteAccess(this.prisma, idUsuario, idCurso);
    } else {
      await checkAlumnoAccess(this.prisma, idUsuario, idCurso);
    }

    const clases = await this.prisma.claseConsulta.findMany({
      where: {
        idCurso,
      },
      orderBy: {
        fechaInicio: 'desc',
      },
      include: {
        docenteResponsable: {
          // El docente a cargo
          select: { nombre: true, apellido: true },
        },
        consultasEnClase: {
          select: {
            consulta: {
              // Seleccionamos el objeto 'consulta'
              include: {
                // E incluimos su 'alumno'
                alumno: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
            // Obtenemos si están revisadas o no (para frontend)
            revisadaEnClase: true,
          },
        },
        motivoClaseNoRealizada: {
          select: { descripcion: true },
        },
      },
    });

    // Mapeamos las clases para agregar el "estadoActual" calculado
    return clases.map((clase) => ({
      ...clase,
      estadoActual: this.getEstadoTemporal(clase),
      motivo: clase.motivoClaseNoRealizada?.descripcion || null,
      motivoClaseNoRealizada: undefined, // Quitamos el objeto anidado para no ensuciar
    }));
  }

  /**
   * Servicio para editar una clase de consulta
   */
  async update(id: string, dto: UpdateClasesConsultaDto, user: UserPayload) {
    const { consultasIds, fechaInicio, fechaFin, ...restDto } = dto;

    // --- Obtemos la clase de consulta ---
    const actual = await this.prisma.claseConsulta.findUnique({
      where: { id },
    });
    if (!actual) throw new NotFoundException('Clase no encontrada');

    // Variables finales para validar
    const dbFechaInicio = fechaInicio
      ? new Date(fechaInicio)
      : actual.fechaInicio;
    const dbFechaFin = fechaFin ? new Date(fechaFin) : actual.fechaFin;

    // Validamos que la hora de inicio sea menor a la hora de fin.
    if (dbFechaInicio >= dbFechaFin) {
      throw new BadRequestException(
        'La fecha/hora de fin debe ser mayor a la de inicio.',
      );
    }

    // Validar pasado (solo si se está cambiando la fecha)
    if (fechaInicio && dbFechaInicio < new Date()) {
      throw new BadRequestException(
        'No puedes reprogramar una clase al pasado.',
      );
    }

    // Validar que no supere los 7 días (si se cambia la fecha)
    if (fechaInicio) {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 7);
      limitDate.setHours(23, 59, 59, 999);
      if (dbFechaInicio > limitDate) {
        throw new BadRequestException(
          'La fecha de la clase no puede superar los 7 días desde hoy.',
        );
      }
    }

    // Validar rango horario (08:00 - 21:00) si cambiaron las fechas
    if (fechaInicio || fechaFin) {
      this.validarRangoHorario(dbFechaInicio, dbFechaFin);
    }

    // --- Validación de superposición en Update ---
    if (fechaInicio || fechaFin) {
      await this.validarSuperposicionConClaseCurso(
        actual.idCurso,
        dbFechaInicio,
        dbFechaFin,
      );
      const overlappingClase = await this.prisma.claseConsulta.findFirst({
        where: {
          id: { not: id },
          idCurso: actual.idCurso,
          deletedAt: null,
          fechaInicio: { lt: dbFechaFin },
          fechaFin: { gt: dbFechaInicio },
        },
      });
      if (overlappingClase) {
        throw new ConflictException(
          'El horario se solapa con otra clase de consulta ya programada.',
        );
      }
    }

    // Validar que el nombre o la descripción no se repitan en OTRAS clases
    const orConditions: Prisma.ClaseConsultaWhereInput[] = [];
    if (restDto.nombre) {
      orConditions.push({ nombre: restDto.nombre });
    }
    if (restDto.descripcion) {
      orConditions.push({ descripcion: restDto.descripcion });
    }

    if (orConditions.length > 0) {
      const existingClase = await this.prisma.claseConsulta.findFirst({
        where: {
          id: { not: id }, // Excluimos la clase actual
          deletedAt: null, // Solo consideramos clases activas
          OR: orConditions,
        },
      });

      if (existingClase) {
        const field =
          restDto.nombre && existingClase.nombre === restDto.nombre
            ? 'nombre'
            : 'descripción';
        throw new ConflictException(
          `Ya existe otra clase de consulta con ese ${field}.`,
        );
      }
    }

    try {
      // Validaciones de acceso y estado
      await checkDocenteAccess(this.prisma, user.userId, actual.idCurso);
      if (actual.estadoClase !== estado_clase_consulta.Programada) {
        throw new ForbiddenException(
          'Solo puedes editar clases "Programadas".',
        );
      }

      this.validarBloqueoPorTiempo(actual);

      if (dto.idDocente) {
        await checkDocenteAccess(this.prisma, dto.idDocente, actual.idCurso);
      }

      const dataToUpdate: Prisma.ClaseConsultaUpdateInput = {
        ...restDto,
        ...(fechaInicio && { fechaInicio: dbFechaInicio }),
        ...(fechaFin && { fechaFin: dbFechaFin }),
      };

      // --- Iniciamos la transacción para actualizar la clase ---
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Actualizamos los datos simples de la clase
          await tx.claseConsulta.update({
            where: { id },
            data: dataToUpdate,
          });

          // Sincronizamos consultas
          if (consultasIds) {
            // Obtenemos las consultas actuales de la clase
            const consultasActuales = await tx.consultaClase.findMany({
              where: { idClaseConsulta: id },
              select: { idConsulta: true },
            });
            const idsActuales = new Set(
              consultasActuales.map((c) => c.idConsulta),
            );
            const idsNuevos = new Set(consultasIds);

            // Calculamos "diff" (las que debemos agregar)
            const idsParaAgregar = consultasIds.filter(
              (id) => !idsActuales.has(id),
            );

            // Calculamos cuales debemos quitar
            const idsParaQuitar = consultasActuales
              .filter((c) => !idsNuevos.has(c.idConsulta))
              .map((c) => c.idConsulta);

            // Validamos que las que vamos a agregar sean pendientes.
            if (idsParaAgregar.length > 0) {
              const consultasNuevas = await tx.consulta.findMany({
                where: { id: { in: idsParaAgregar } },
              });
              const noPendientes = consultasNuevas.filter(
                (c) => c.estado !== estado_consulta.Pendiente,
              );
              if (noPendientes.length > 0) {
                throw new BadRequestException(
                  'Solo puedes agregar consultas "Pendientes".',
                );
              }
            }

            // Eliminamos los registros en la tabla consulta_clase y las devolvemos a estado Pendiente.
            if (idsParaQuitar.length > 0) {
              await tx.consultaClase.deleteMany({
                where: {
                  idClaseConsulta: id,
                  idConsulta: { in: idsParaQuitar },
                },
              });
              await tx.consulta.updateMany({
                where: { id: { in: idsParaQuitar } },
                data: { estado: estado_consulta.Pendiente }, // Devolver a Pendiente
              });
            }

            // Creamos los registros en la tabla consulta_clase y la colocamos en estado A revisar.
            if (idsParaAgregar.length > 0) {
              await tx.consultaClase.createMany({
                data: idsParaAgregar.map((idConsulta) => ({
                  idClaseConsulta: id,
                  idConsulta: idConsulta,
                })),
              });
              await tx.consulta.updateMany({
                where: { id: { in: idsParaAgregar } },
                data: { estado: estado_consulta.A_revisar }, // Poner en A revisar
              });
            }
          }

          // Devolvemos la clase actualizada con sus relaciones
          return tx.claseConsulta.findUnique({
            where: { id },
            include: {
              docenteResponsable: { select: { nombre: true, apellido: true } },
              consultasEnClase: {
                select: { consulta: { select: { id: true, titulo: true } } },
              },
            },
          });
        },
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error en ClasesConsultaService.update:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la clase de consulta.',
      );
    }
  }

  /**
   * Servicio para aceptar clase modificando fecha y hora manualmente (proceso automatizado).
   * Solo permite cambiar fecha/hora, asigna al docente y cambia estado a Programada.
   */
  async aceptarYReprogramar(
    idClase: string,
    idDocente: string,
    datos: { fechaInicio: string; fechaFin: string },
  ) {
    try {
      // Obtenemos la clase de consulta
      const clase = await this.prisma.claseConsulta.findUnique({
        where: { id: idClase },
      });

      if (!clase) throw new NotFoundException('Clase no encontrada.');

      // Validación estricta de estado
      if (clase.estadoClase !== estado_clase_consulta.Pendiente_Asignacion) {
        throw new BadRequestException(
          'Esta clase ya no está pendiente de asignación.',
        );
      }

      const dbFechaInicio = new Date(datos.fechaInicio);
      const dbFechaFin = new Date(datos.fechaFin);

      // --- VALIDACIONES DE FECHA Y HORA (Igual que en create/update) ---
      if (dbFechaInicio >= dbFechaFin) {
        throw new BadRequestException(
          'La fecha/hora de fin debe ser mayor a la de inicio.',
        );
      }
      if (dbFechaInicio < new Date()) {
        throw new BadRequestException(
          'No puedes reprogramar una clase al pasado.',
        );
      }

      // Validar rango horario (08:00 - 21:00) y duración (max 4hs)
      this.validarRangoHorario(dbFechaInicio, dbFechaFin);

      // Validar superposición con horario de cursada
      await this.validarSuperposicionConClaseCurso(
        clase.idCurso,
        dbFechaInicio,
        dbFechaFin,
      );

      // Validar superposición con otras clases de consulta
      const overlappingClase = await this.prisma.claseConsulta.findFirst({
        where: {
          id: { not: idClase },
          idCurso: clase.idCurso,
          deletedAt: null,
          fechaInicio: { lt: dbFechaFin },
          fechaFin: { gt: dbFechaInicio },
        },
      });

      if (overlappingClase) {
        throw new ConflictException(
          'El horario se solapa con otra clase de consulta ya programada.',
        );
      }

      // Actualizamos solo lo necesario
      const claseActualizada = await this.prisma.claseConsulta.update({
        where: { id: idClase },
        data: {
          idDocente: idDocente, // Se asigna
          estadoClase: estado_clase_consulta.Programada, // Se confirma
          fechaInicio: dbFechaInicio,
          fechaFin: dbFechaFin,
        },
        include: {
          docenteResponsable: { select: { nombre: true, apellido: true } },
          consultasEnClase: {
            include: {
              consulta: {
                include: { alumno: true },
              },
            },
          },
        },
      });

      // Notificamos a los alumnos que tenían consultas en esta clase
      this.notificarAlumnosClaseProgramada(claseActualizada);

      return claseActualizada;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error en aceptarYReprogramar:', error);
      throw new InternalServerErrorException('Error al reprogramar la clase.');
    }
  }

  /**
   * Servicio para aceptar una clase de consulta automática.
   * Permite a un docente asignarse una clase automática pendiente.
   */
  async asignarDocente(
    idClase: string,
    idDocente: string,
    nuevaFecha?: string,
  ) {
    try {
      // Obtenemos la clase y verificamos el estado
      const clase = await this.prisma.claseConsulta.findUnique({
        where: { id: idClase },
      });

      if (!clase) {
        throw new NotFoundException('Clase no encontrada.');
      }

      // Validamos que la clase no tenga otro docente asignado
      if (clase.estadoClase !== estado_clase_consulta.Pendiente_Asignacion) {
        throw new BadRequestException(
          'Esta clase ya tiene un docente asignado o no requiere asignación.',
        );
      }

      if (clase.idDocente) {
        throw new BadRequestException('Otro docente ya tomó esta clase.');
      }

      const dataUpdate: any = {
        idDocente: idDocente,
        estadoClase: estado_clase_consulta.Programada,
      };

      // Si nos pasaron una nueva fecha, la aplicamos
      if (nuevaFecha) {
        const fechaObj = new Date(nuevaFecha);
        dataUpdate.fechaInicio = fechaObj;
        dataUpdate.fechaFin = new Date(fechaObj.getTime() + 60 * 60 * 1000);
      }

      // Actualizamos la clase
      const claseActualizada = await this.prisma.claseConsulta.update({
        where: { id: idClase },
        data: dataUpdate,
        include: {
          docenteResponsable: {
            select: { nombre: true, apellido: true },
          },
          consultasEnClase: {
            include: {
              consulta: {
                include: { alumno: true },
              },
            },
          },
        },
      });

      // Notificamos a los alumnos que tenían consultas en esta clase
      this.notificarAlumnosClaseProgramada(claseActualizada);

      return claseActualizada;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error en asignarDocente:', error);
      throw new InternalServerErrorException('Error al asignar la clase.');
    }
  }

  /**
   * Servicio para finalizar una clase de consulta.
   * Si se realizó, se indican las consultas revisadas y si no se realizó se indica un motivo
   */
  async finalizar(idClase: string, dto: FinalizarClaseDto, user: UserPayload) {
    const { realizada, motivo, consultasRevisadasIds } = dto;

    // Obtenemos la clase y sus relaciones.
    const clase = await this.prisma.claseConsulta.findUnique({
      where: { id: idClase },
      include: { consultasEnClase: true },
    });

    if (!clase) throw new NotFoundException('Clase no encontrada.');

    // Validamos los permisos
    if (clase.idDocente !== user.userId && user.rol !== roles.Administrador) {
      throw new ForbiddenException('No eres el responsable de esta clase.');
    }

    // Validamos que no esté finalizada
    if (
      clase.estadoClase === estado_clase_consulta.Realizada ||
      clase.estadoClase === estado_clase_consulta.No_realizada ||
      clase.estadoClase === estado_clase_consulta.Cancelada
    ) {
      throw new BadRequestException(
        'La clase ya fue finalizada anteriormente.',
      );
    }

    // Ejecutamos la transacción
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (realizada) {
        // --- CASO A: LA CLASE SE REALIZÓ ---

        // A. Actualizamos el estado de la clase
        await tx.claseConsulta.update({
          where: { id: idClase },
          data: {
            estadoClase: estado_clase_consulta.Realizada,
          },
        });

        // B. Procesamos las consultas
        const idsAgendadas = clase.consultasEnClase.map((c) => c.idConsulta);
        const idsRevisadasSet = new Set(consultasRevisadasIds || []);

        // B.1. Marcamos las REVISADAS
        if (idsRevisadasSet.size > 0) {
          // Tabla intermedia
          await tx.consultaClase.updateMany({
            where: {
              idClaseConsulta: idClase,
              idConsulta: { in: Array.from(idsRevisadasSet) },
            },
            data: { revisadaEnClase: true },
          });
          // Tabla consultas (Estado)
          await tx.consulta.updateMany({
            where: { id: { in: Array.from(idsRevisadasSet) } },
            data: { estado: estado_consulta.Revisada },
          });
        }

        // B.2. Devolvemos las NO REVISADAS a Pendiente
        const idsNoRevisadas = idsAgendadas.filter(
          (id) => !idsRevisadasSet.has(id),
        );
        if (idsNoRevisadas.length > 0) {
          await tx.consulta.updateMany({
            where: { id: { in: idsNoRevisadas } },
            data: { estado: estado_consulta.Pendiente },
          });
        }
      } else {
        // --- CASO B: NO SE REALIZÓ ---

        // A. Validamos motivo
        if (!motivo) {
          throw new BadRequestException(
            'Debe indicar un motivo si la clase no se realizó.',
          );
        }

        // B. Actualizamos el estado de la clase
        await tx.claseConsulta.update({
          where: { id: idClase },
          data: {
            estadoClase: estado_clase_consulta.No_realizada,
          },
        });

        // C. Guardamos el motivo en la tabla
        await tx.motivoClaseNoRealizada.create({
          data: {
            idClaseConsulta: idClase,
            descripcion: motivo,
          },
        });

        // D. Devolvemos todas las consultas a Pendiente.
        const idsTodas = clase.consultasEnClase.map((c) => c.idConsulta);
        if (idsTodas.length > 0) {
          await tx.consulta.updateMany({
            where: { id: { in: idsTodas } },
            data: { estado: estado_consulta.Pendiente },
          });
        }
      }

      return { message: 'Clase finalizada correctamente' };
    });
  }

  /**
   * Servicio para cancelar una clase de consulta con motivo.
   */
  async cancelar(id: string, dto: CancelarClaseDto, user: UserPayload) {
    // Obtenemos la clase a cancelar
    const clase = await this.prisma.claseConsulta.findUnique({
      where: { id },
      include: {
        docenteResponsable: { select: { nombre: true, apellido: true } },
      },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada.');

    await checkDocenteAccess(this.prisma, user.userId, clase.idCurso);

    // Validamos que la clase a cancelar esté programada.
    if (clase.estadoClase !== estado_clase_consulta.Programada) {
      throw new ForbiddenException(
        'Solo puedes cancelar clases en estado "Programada".',
      );
    }

    this.validarBloqueoPorTiempo(clase);

    // Hacemos la baja lógica
    const resultado = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // a. Actualizar la clase a 'Cancelada' y marcar 'deletedAt'
        const claseCancelada = await tx.claseConsulta.update({
          where: { id },
          data: {
            estadoClase: estado_clase_consulta.Cancelada,
            deletedAt: new Date(),
          },
        });

        // b. Registrar el motivo en la tabla correspondiente
        await tx.motivoClaseNoRealizada.create({
          data: {
            idClaseConsulta: id,
            descripcion: dto.motivo,
          },
        });

        // c. Obtenemos las consultas vinculadas para notificar a los alumnos
        const consultasVinculadas = await tx.consultaClase.findMany({
          where: { idClaseConsulta: id },
          include: {
            consulta: {
              include: { alumno: { select: { email: true, nombre: true } } },
            },
          },
        });

        const idsConsultas = consultasVinculadas.map((c) => c.idConsulta);

        // d. Devolvemos todas las consultas a Pendiente.
        if (idsConsultas.length > 0) {
          await tx.consulta.updateMany({
            where: { id: { in: idsConsultas } },
            data: { estado: estado_consulta.Pendiente },
          });
        }

        return { claseCancelada, consultasVinculadas };
      },
    );

    // --- NOTIFICACIÓN POR CORREO (Fuera de la transacción) ---
    // Extraemos destinatarios únicos
    const destinatariosMap = new Map<
      string,
      { email: string; nombre: string }
    >();
    resultado.consultasVinculadas.forEach((cc) => {
      const alumno = cc.consulta.alumno;
      if (alumno) {
        destinatariosMap.set(alumno.email, alumno);
      }
    });

    if (destinatariosMap.size > 0) {
      this.mailService.enviarAvisoCancelacionClase(
        Array.from(destinatariosMap.values()),
        {
          nombreClase: clase.nombre,
          fechaClase: clase.fechaInicio,
          motivo: dto.motivo,
          nombreDocente: `${clase.docenteResponsable?.nombre} ${clase.docenteResponsable?.apellido}`,
        },
      );
    }

    return resultado.claseCancelada;
  }

  /**
   * CRON JOB: Actualización automática de estados de clases de consulta.
   * Se ejecuta cada minuto.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronEstadosClases() {
    const now = new Date();

    // 1. Pasar a "En curso"
    // Clases Programada que ya empezaron y no terminaron
    await this.prisma.claseConsulta.updateMany({
      where: {
        estadoClase: estado_clase_consulta.Programada,
        fechaInicio: { lte: now },
        fechaFin: { gt: now },
        deletedAt: null,
      },
      data: {
        estadoClase: estado_clase_consulta.En_curso,
      },
    });

    // 2. Pasar a "Finalizada"
    // Clases En_curso o Programada que ya terminaron
    await this.prisma.claseConsulta.updateMany({
      where: {
        estadoClase: {
          in: [
            estado_clase_consulta.Programada,
            estado_clase_consulta.En_curso,
          ],
        },
        fechaFin: { lte: now },
        deletedAt: null,
      },
      data: {
        estadoClase: estado_clase_consulta.Finalizada,
      },
    });
  }

  // --------------- HELPERS PRIVADOS --------------- //

  /**
   * Helper para validar superposición considerando UTC-3 (Argentina)
   */
  private async validarSuperposicionConClaseCurso(
    idCurso: string,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    const diaEnum = getDiaSemanaEnum(fechaInicio);
    if (!diaEnum) return;

    // 1. Buscamos los horarios de cursada para ese día
    const diasDeClase = await this.prisma.diaClase.findMany({
      where: {
        idCurso: idCurso,
        dia: diaEnum,
      },
    });

    if (!diasDeClase.length) return;

    // 2. Convertir el INPUT a minutos del día (UTC)
    const consultaInicioMin =
      fechaInicio.getUTCHours() * 60 + fechaInicio.getUTCMinutes();
    let consultaFinMin = fechaFin.getUTCHours() * 60 + fechaFin.getUTCMinutes();

    // Ajuste por cruce de medianoche UTC (ej: 21:00 Local -> 00:00 UTC del día siguiente)
    // Si el fin es menor o igual al inicio (en minutos del día), significa que cruzó al día siguiente.
    if (consultaFinMin <= consultaInicioMin) {
      consultaFinMin += 24 * 60;
    }

    // 3. Iterar y comparar, ajustando la BD a Hora Local (-3)
    for (const claseCurso of diasDeClase) {
      // COMPARACIÓN UTC vs UTC (Sin offsets)
      // Si BD tiene 12:00 (UTC) y Input tiene 12:00 (UTC), comparamos 12 con 12.
      const cursoInicioMin =
        claseCurso.horaInicio.getUTCHours() * 60 +
        claseCurso.horaInicio.getUTCMinutes();
      let cursoFinMin =
        claseCurso.horaFin.getUTCHours() * 60 +
        claseCurso.horaFin.getUTCMinutes();

      // Ajuste similar para el horario de cursada (por si acaso cruza medianoche UTC)
      if (cursoFinMin <= cursoInicioMin) {
        cursoFinMin += 24 * 60;
      }

      // Lógica de solapamiento
      const noSeSolapa =
        consultaFinMin <= cursoInicioMin || consultaInicioMin >= cursoFinMin;

      if (!noSeSolapa) {
        // Formateamos la hora para mostrarla amigablemente en el error
        // Aquí SÍ aplicamos el offset para que el usuario vea "09:00" y no "12:00"
        const offsetArg = 3;
        let hInicioLocal = claseCurso.horaInicio.getUTCHours() - offsetArg;
        let hFinLocal = claseCurso.horaFin.getUTCHours() - offsetArg;
        if (hInicioLocal < 0) hInicioLocal += 24;
        if (hFinLocal < 0) hFinLocal += 24;

        const inicioLegible = `${hInicioLocal.toString().padStart(2, '0')}:${claseCurso.horaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
        const finLegible = `${hFinLocal.toString().padStart(2, '0')}:${claseCurso.horaFin.getUTCMinutes().toString().padStart(2, '0')}`;

        throw new BadRequestException(
          `Conflicto de horario: El curso tiene clase regular los ${diaEnum} de ${inicioLegible} a ${finLegible}.`,
        );
      }
    }
  }

  /**
   * Helper para validar que la clase esté entre las 08:00 y las 21:00 (Hora Local UTC-3)
   */
  private validarRangoHorario(fechaInicio: Date, fechaFin: Date) {
    // Convertimos a hora local (UTC-3)
    // (getUTCHours() devuelve 0-23. Restamos 3 y ajustamos si es negativo)
    const getLocalHour = (date: Date) => {
      let hour = date.getUTCHours() - 3;
      if (hour < 0) hour += 24;
      return hour;
    };

    const startHour = getLocalHour(fechaInicio);
    const endHour = getLocalHour(fechaFin);
    const endMinutes = fechaFin.getUTCMinutes();

    // Reglas: Inicio >= 8, Fin <= 21 (si es 21, minutos deben ser 0)
    if (startHour < 8 || endHour > 21 || (endHour === 21 && endMinutes > 0)) {
      throw new BadRequestException(
        'El horario de clase debe estar entre las 08:00 y las 21:00 hs.',
      );
    }

    // Regla: Duración máxima de 4 horas
    const diffMs = fechaFin.getTime() - fechaInicio.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 4) {
      throw new BadRequestException(
        'La duración máxima de una clase de consulta es de 4 horas.',
      );
    }
  }

  /**
   * Helper para calcular el estado temporal basado en la hora
   */
  private getEstadoTemporal(clase: ClaseConsulta) {
    // Si la clase ya tiene un estado definitivo (Cancelada, Realizada, etc.), respetarlo.
    if (
      clase.estadoClase !== estado_clase_consulta.Programada &&
      clase.estadoClase !== estado_clase_consulta.Pendiente_Asignacion
    ) {
      return clase.estadoClase;
    }

    const ahora = new Date();

    // Lógica de estados temporales
    if (ahora >= clase.fechaInicio && ahora < clase.fechaFin) {
      return estado_clase_consulta.En_curso;
    } else if (ahora >= clase.fechaFin) {
      return estado_clase_consulta.Finalizada;
    }

    return clase.estadoClase; // 'Programada'
  }

  /**
   * Helper para validar si se puede editar/borrar (SI NO ESTÁ EN CURSO)
   */
  private validarBloqueoPorTiempo(clase: ClaseConsulta) {
    const ahora = new Date();

    // Si la clase ya empezó (ahora >= inicio), bloqueamos edición/borrado
    if (ahora >= clase.fechaInicio) {
      throw new ForbiddenException(
        'No se puede editar, cancelar o eliminar una clase que ya está en curso o finalizó.',
      );
    }
  }

  /**
   * Helper para notificar a los alumnos cuando una clase pasa a estar "Programada"
   */
  private notificarAlumnosClaseProgramada(clase: any) {
    if (!clase.docenteResponsable || !clase.consultasEnClase) return;

    const alumnosMap = new Map<
      string,
      { email: string; nombre: string; consultas: string[] }
    >();

    clase.consultasEnClase.forEach((cc: any) => {
      const c = cc.consulta;
      if (c && c.alumno) {
        if (!alumnosMap.has(c.idAlumno)) {
          alumnosMap.set(c.idAlumno, {
            email: c.alumno.email,
            nombre: c.alumno.nombre,
            consultas: [],
          });
        }
        alumnosMap.get(c.idAlumno)?.consultas.push(c.titulo);
      }
    });

    const destinatarios = Array.from(alumnosMap.values());

    if (destinatarios.length > 0) {
      this.mailService.enviarAvisoClaseConsultaAlumno(destinatarios, {
        nombreClase: clase.nombre,
        nombreDocente: `${clase.docenteResponsable.nombre} ${clase.docenteResponsable.apellido}`,
        fechaInicio: clase.fechaInicio,
        modalidad: clase.modalidad,
        idClase: clase.id,
      });
    }
  }
}
