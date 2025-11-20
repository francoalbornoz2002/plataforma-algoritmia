import {
  BadRequestException,
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
  dias_semana,
  estado_clase_consulta,
  estado_consulta,
  estado_revision,
  Prisma,
  roles,
} from '@prisma/client';
import { timeToDate } from 'src/helpers';

// --- HELPER LOCAL EXPLÍCITO (Ponlo fuera de la clase o al final) ---
function timeToDateLocal(time: string): Date {
  if (!time) return new Date(0);
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(0);
  date.setUTCHours(hours + 3);
  date.setUTCMinutes(minutes);

  console.log(
    `[DEBUG] timeToDateLocal: Input=${time} -> OutputUTC=${date.toISOString()}`,
  );
  return date;
}

// NUEVO: Helper para obtener minutos desde medianoche (para comparaciones fáciles)
function getMinutesFromMidnight(timeInput: Date | string): number {
  if (typeof timeInput === 'string') {
    const [hours, minutes] = timeInput.split(':').map(Number);
    return hours * 60 + minutes;
  } else {
    // Asumimos que es un Date de Prisma (UTC o ajustado), extraemos UTCHours
    // OJO: Depende de cómo Prisma te devuelva el 'Time'.
    // Normalmente Prisma devuelve un Date con fecha 1970-01-01.
    // Para evitar líos de timezone del Date object, usamos getUTCHours si guardaste con timeToDateLocal
    // Pero si viene directo de la BD (DiaClase), Prisma suele devolverlo "crudo".
    // Para mayor seguridad con tu configuración actual:
    const hours = timeInput.getUTCHours();
    const minutes = timeInput.getUTCMinutes();
    // Ajuste inverso si es necesario, pero para comparar duraciones relativas:
    // Si tus dias_clase en BD están guardados igual que clases_consulta, usamos UTC.
    // Si dias_clase se guardaron directo, podrían ser horas "reales".
    // Vamos a usar getHours/Minutes locales del objeto Date si asumimos que el driver de PG lo parsea bien.
    // MEJOR ESTRATEGIA: Usar getUTCHours asumiendo consistencia en tu BD.
    // Como tu timeToDateLocal suma +3, aquí restamos o usamos directo si todo está en la misma base.
    // Asumiremos que ambos objetos Date (DiaClase y el generado) son comparables via getTime o UTC.
    return timeInput.getUTCHours() * 60 + timeInput.getUTCMinutes();
  }
}

// NUEVO: Helper para mapear JS Date day (0-6) a Enum Prisma
function getDiaSemanaEnum(date: Date): dias_semana | null {
  // getDay(): 0 = Domingo, 1 = Lunes, ...
  const dayIndex = date.getUTCDay(); // Usamos UTC day para coincidir con la fecha enviada
  const map: Record<number, dias_semana> = {
    1: dias_semana.Lunes,
    2: dias_semana.Martes,
    3: dias_semana.Miercoles,
    4: dias_semana.Jueves,
    5: dias_semana.Viernes,
    6: dias_semana.Sabado,
  };
  return map[dayIndex] || null; // Domingo devuelve null (no hay clases)
}

@Injectable()
export class ClasesConsultaService {
  constructor(private prisma: PrismaService) {}

  /**
   * TAREA: Implementar servicio para crear la clase de consulta.
   * REGLA: Consultas deben estar 'Pendiente'.
   * REGLA: Docente a cargo debe pertenecer al curso.
   */
  async create(dto: CreateClasesConsultaDto, user: UserPayload) {
    const {
      idCurso,
      idDocente, // Docente a cargo (elegido)
      consultasIds, // Array de IDs de consultas
      fechaClase,
      horaInicio,
      horaFin,
      ...restDto // nombre, descripcion, modalidad
    } = dto;

    // 1. Validación básica de horas
    if (horaInicio >= horaFin) {
      throw new BadRequestException(
        'La hora de fin debe ser mayor a la de inicio.',
      );
    }
    if (horaFin > '23:00') {
      throw new BadRequestException('Hora fin inválida (> 23:00).');
    }

    // El 'user.userId' es el docente QUE ESTÁ CREANDO la clase
    const idDocenteCreador = user.userId;

    // --- NUEVO: Validación de superposición con horario de cursada ---
    // Convertimos fechaClase (string o Date) a objeto Date real para sacar el día
    const fechaObj = new Date(fechaClase);
    // Importante: Asegurar que fechaObj no tenga offset indeseado que cambie el día.
    // Si viene "2025-11-20", new Date() lo toma UTC.

    await this.validarSuperposicionConClaseCurso(
      idCurso,
      fechaObj,
      horaInicio,
      horaFin,
    );
    // --------------------------------------------------------------

    try {
      // --- TRANSACCIÓN ---
      return await this.prisma.$transaction(async (tx: PrismaService) => {
        // --- 1. Validación de Seguridad (Reglas de Negocio) ---

        // a. Validar que el docente creador pertenece al curso
        await this.checkDocenteAccess(tx, idDocenteCreador, idCurso);

        // b. Validar que el docente ELEGIDO (idDocente) pertenece al curso
        await this.checkDocenteAccess(tx, idDocente, idCurso);

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
            fechaClase: new Date(fechaClase),
            horaInicio: timeToDateLocal(horaInicio),
            horaFin: timeToDateLocal(horaFin),
            estadoClase: estado_clase_consulta.Programada,
            estadoRevision: estado_revision.Pendiente,
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
   * TAREA: Implementar servicio para obtener todas las clases.
   * REGLA: Se ven todas (incluyendo canceladas).
   */
  async findAll(idCurso: string, user: UserPayload) {
    // (Añadí validación de que el usuario pertenezca al curso para verlas)
    const idUsuario = user.userId;
    if (user.rol === roles.Docente) {
      await this.checkDocenteAccess(this.prisma, idUsuario, idCurso);
    } else {
      await this.checkAlumnoAccess(this.prisma, idUsuario, idCurso);
    }

    return this.prisma.claseConsulta.findMany({
      where: {
        idCurso,
      },
      orderBy: {
        fechaClase: 'desc',
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
          },
        },
      },
    });
  }

  /**
   * TAREA: Implementar servicio para editar.
   * REGLA: Solo se puede editar si está 'Programada'.
   */
  /**
   * TAREA: Implementar servicio para editar.
   * REGLA: Sincronizar consultas.
   */
  async update(id: string, dto: UpdateClasesConsultaDto, user: UserPayload) {
    const { consultasIds, fechaClase, horaInicio, horaFin, ...restDto } = dto;

    // --- Recuperar datos actuales si no vienen todos en el DTO ---
    const actual = await this.prisma.claseConsulta.findUnique({
      where: { id },
    });
    if (!actual) throw new NotFoundException('Clase no encontrada');

    // Helper para recuperar string HH:mm de la BD (reversión del hack +3)
    const toTimeStr = (d: Date) => {
      const date = new Date(d);
      date.setUTCHours(date.getUTCHours() - 3);
      return date.toISOString().substring(11, 16);
    };

    // Variables finales para validar
    const fechaParaValidar = fechaClase
      ? new Date(fechaClase)
      : actual.fechaClase;
    const inicioParaValidar = horaInicio
      ? horaInicio
      : toTimeStr(actual.horaInicio);
    const finParaValidar = horaFin ? horaFin : toTimeStr(actual.horaFin);

    // 1. Validación básica
    if (inicioParaValidar >= finParaValidar) {
      throw new BadRequestException(
        'La hora de fin debe ser mayor a la de inicio.',
      );
    }

    // --- NUEVO: Validación de superposición en Update ---
    // Si cambiaron la fecha o las horas, validamos de nuevo
    if (fechaClase || horaInicio || horaFin) {
      await this.validarSuperposicionConClaseCurso(
        actual.idCurso,
        fechaParaValidar,
        inicioParaValidar,
        finParaValidar,
      );
    }
    // ----------------------------------------------------

    try {
      // Validaciones de acceso y estado
      await this.checkDocenteAccess(this.prisma, user.userId, actual.idCurso);
      if (actual.estadoClase !== estado_clase_consulta.Programada) {
        throw new ForbiddenException(
          'Solo puedes editar clases "Programadas".',
        );
      }
      if (dto.idDocente) {
        await this.checkDocenteAccess(
          this.prisma,
          dto.idDocente,
          actual.idCurso,
        );
      }

      const dataToUpdate: Prisma.ClaseConsultaUpdateInput = {
        ...restDto,
        ...(fechaClase && { fechaClase: new Date(fechaClase) }),
        ...(horaInicio && { horaInicio: timeToDateLocal(horaInicio) }),
        ...(horaFin && { horaFin: timeToDateLocal(horaFin) }),
      };

      // --- 5. INICIAR TRANSACCIÓN PARA SINCRONIZAR ---
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 5a. Actualizar los datos simples de la clase
          await tx.claseConsulta.update({
            where: { id },
            data: dataToUpdate,
          });

          // 5b. Sincronizar consultas (SI el DTO las incluyó)
          if (consultasIds) {
            // b.1. OBTENER ESTADO ACTUAL
            const consultasActuales = await tx.consultaClase.findMany({
              where: { idClaseConsulta: id },
              select: { idConsulta: true },
            });
            const idsActuales = new Set(
              consultasActuales.map((c) => c.idConsulta),
            );
            const idsNuevos = new Set(consultasIds);

            // b.2. CALCULAR "DIFF"
            const idsParaAgregar = consultasIds.filter(
              (id) => !idsActuales.has(id),
            );
            const idsParaQuitar = consultasActuales
              .filter((c) => !idsNuevos.has(c.idConsulta))
              .map((c) => c.idConsulta);

            // b.3. VALIDAR 'idsParaAgregar' (deben estar 'Pendiente')
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

            // b.4. PROCESAR 'idsParaQuitar'
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

            // b.5. PROCESAR 'idsParaAgregar'
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
          } // Fin del 'if (consultasIds)'

          // 5c. Devolver la clase actualizada (con relaciones)
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
      ); // --- FIN DE LA TRANSACCIÓN ---
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
   * NUEVO: Aceptar clase modificando fecha y hora manualmente.
   * Solo permite cambiar fecha/hora, asigna al docente y cambia estado a Programada.
   */
  async aceptarYReprogramar(
    idClase: string,
    idDocente: string,
    datos: { fechaClase: string; horaInicio: string; horaFin: string },
  ) {
    try {
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

      // Actualizamos solo lo necesario
      return await this.prisma.claseConsulta.update({
        where: { id: idClase },
        data: {
          idDocente: idDocente, // Se asigna
          estadoClase: estado_clase_consulta.Programada, // Se confirma
          fechaClase: new Date(datos.fechaClase),
          horaInicio: timeToDate(datos.horaInicio), // Usa tu helper timeToDate
          horaFin: timeToDate(datos.horaFin), // Usa tu helper timeToDate
        },
        include: {
          docenteResponsable: { select: { nombre: true, apellido: true } },
        },
      });
    } catch (error) {
      console.error('Error en aceptarYReprogramar:', error);
      throw new InternalServerErrorException('Error al reprogramar la clase.');
    }
  }

  /**
   * Permite a un docente asignarse una clase automática pendiente.
   */
  async asignarDocente(
    idClase: string,
    idDocente: string,
    nuevaFecha?: string,
  ) {
    try {
      // 1. Buscar la clase y verificar estado
      const clase = await this.prisma.claseConsulta.findUnique({
        where: { id: idClase },
      });

      if (!clase) {
        throw new NotFoundException('Clase no encontrada.');
      }

      // 2. Validaciones de Negocio
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

      // Si nos pasaron una nueva fecha (Botón 2), la aplicamos
      if (nuevaFecha) {
        const fechaObj = new Date(nuevaFecha);
        dataUpdate.fechaClase = fechaObj;
        dataUpdate.horaInicio = fechaObj;
        // Recalculamos fin (asumiendo 1 hora de duración)
        dataUpdate.horaFin = new Date(fechaObj.getTime() + 60 * 60 * 1000);
      }

      // 3. Actualizar la clase
      const claseActualizada = await this.prisma.claseConsulta.update({
        where: { id: idClase },
        data: dataUpdate,
        include: {
          docenteResponsable: {
            select: { nombre: true, apellido: true },
          },
        },
      });

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
   * TAREA: Implementar "baja lógica".
   * REGLA: Solo se puede cancelar si está 'Programada'.
   */
  async remove(id: string, user: UserPayload) {
    // 1. Validar que el docente puede borrar
    const clase = await this.prisma.claseConsulta.findUnique({
      where: { id },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada.');

    await this.checkDocenteAccess(this.prisma, user.userId, clase.idCurso);

    // 2. REGLA: Validar estado 'Programada'
    if (clase.estadoClase !== estado_clase_consulta.Programada) {
      throw new ForbiddenException(
        'Solo puedes cancelar clases en estado "Programada".',
      );
    }

    // 3. Hacer el "soft delete" (que en tu schema es un UPDATE)
    // Usamos $transaction para revertir el estado de las consultas
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Actualizar la clase a 'Cancelada' y marcar 'deletedAt'
      const claseCancelada = await tx.claseConsulta.update({
        where: { id },
        data: {
          estadoClase: estado_clase_consulta.Cancelada,
          deletedAt: new Date(),
        },
      });

      // b. Buscar las consultas que estaban "A revisar" por esta clase
      const consultasVinculadas = await tx.consultaClase.findMany({
        where: { idClaseConsulta: id },
        select: { idConsulta: true },
      });
      const idsConsultas = consultasVinculadas.map((c) => c.idConsulta);

      // c. Devolver esas consultas a "Pendiente"
      await tx.consulta.updateMany({
        where: { id: { in: idsConsultas } },
        data: { estado: estado_consulta.Pendiente },
      });

      // d. (Opcional: Borrar los vínculos en 'ConsultaClase')
      await tx.consultaClase.deleteMany({
        where: { idClaseConsulta: id },
      });

      return claseCancelada;
    });
  }

  // --- Helpers de Seguridad ---
  private async checkDocenteAccess(
    tx: PrismaService,
    idDocente: string,
    idCurso: string,
  ) {
    const asignacion = await tx.docenteCurso.findFirst({
      where: {
        idDocente,
        idCurso,
        estado: 'Activo',
      },
    });
    if (!asignacion) {
      throw new ForbiddenException('El docente no está activo en este curso.');
    }
  }

  private async checkAlumnoAccess(
    tx: Prisma.TransactionClient | PrismaService,
    idAlumno: string,
    idCurso: string,
  ) {
    const inscripcion = await tx.alumnoCurso.findFirst({
      where: {
        idAlumno,
        idCurso,
        estado: 'Activo',
      },
    });
    if (!inscripcion) {
      throw new ForbiddenException('El alumno no está activo en este curso.');
    }
  }

  // Función Helper para validar superposición considerando UTC-3 (Argentina)
  private async validarSuperposicionConClaseCurso(
    idCurso: string,
    fechaClase: Date,
    horaInicioStr: string,
    horaFinStr: string,
  ) {
    const diaEnum = getDiaSemanaEnum(fechaClase);
    if (!diaEnum) return;

    // 1. Buscamos los horarios de cursada para ese día
    const diasDeClase = await this.prisma.diaClase.findMany({
      where: {
        idCurso: idCurso,
        dia: diaEnum,
      },
    });

    if (!diasDeClase.length) return;

    // 2. Convertir el INPUT (Hora Local) a minutos
    // Ejemplo: "09:00" -> 9 * 60 = 540 minutos
    const consultaInicioMin =
      parseInt(horaInicioStr.split(':')[0]) * 60 +
      parseInt(horaInicioStr.split(':')[1]);
    const consultaFinMin =
      parseInt(horaFinStr.split(':')[0]) * 60 +
      parseInt(horaFinStr.split(':')[1]);

    // 3. Iterar y comparar, ajustando la BD a Hora Local (-3)
    for (const claseCurso of diasDeClase) {
      // BD tiene 12:00 (UTC). Restamos 3 para tener 09:00 (Local)
      const offsetArg = 3;

      let horaInicioDb = claseCurso.horaInicio.getUTCHours() - offsetArg;
      let horaFinDb = claseCurso.horaFin.getUTCHours() - offsetArg;

      // Manejo básico por si la resta da negativo (ej: 02:00 UTC - 3 = -1 -> 23:00 del dia anterior),
      // aunque en tu esquema de "DiaClase" esto es raro.
      if (horaInicioDb < 0) horaInicioDb += 24;
      if (horaFinDb < 0) horaFinDb += 24;

      const cursoInicioMin =
        horaInicioDb * 60 + claseCurso.horaInicio.getUTCMinutes();
      const cursoFinMin = horaFinDb * 60 + claseCurso.horaFin.getUTCMinutes();

      // Lógica de solapamiento
      const noSeSolapa =
        consultaFinMin <= cursoInicioMin || consultaInicioMin >= cursoFinMin;

      if (!noSeSolapa) {
        // Formateamos la hora para mostrarla amigablemente en el error
        const inicioLegible = `${horaInicioDb}:${claseCurso.horaInicio.getUTCMinutes().toString().padStart(2, '0')}`;
        const finLegible = `${horaFinDb}:${claseCurso.horaFin.getUTCMinutes().toString().padStart(2, '0')}`;

        throw new BadRequestException(
          `Conflicto de horario: El curso tiene clase regular los ${diaEnum} de ${inicioLegible} a ${finLegible}.`,
        );
      }
    }
  }
}
