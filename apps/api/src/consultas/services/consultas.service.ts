import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  estado_clase_consulta,
  estado_consulta,
  temas,
} from '@prisma/client';

// DTOs
import type { CreateConsultaDto } from '../dto/create-consulta.dto';
import type { CreateRespuestaDto } from '../dto/create-respuesta.dto';
import type { ValorarConsultaDto } from '../dto/valorar-consulta.dto';
import { FindConsultasDto } from '../dto/find-consultas.dto';
import { UpdateConsultaDto } from '../dto/update-consulta.dto';
import { calcularFechaProximaClase } from 'src/helpers';
import { MailService } from 'src/mail/services/mail.service';

@Injectable()
export class ConsultasService {
  private readonly logger = new Logger(ConsultasService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // --- 1. SERVICIO DE CREACIÓN (ALUMNO) ---
  async createConsulta(
    idAlumno: string,
    idCurso: string,
    dto: CreateConsultaDto,
  ) {
    const { titulo, descripcion, tema, fechaConsulta } = dto;

    // Validar que el título y la descripción no sean iguales
    if (titulo.toLowerCase() === descripcion.toLowerCase()) {
      throw new BadRequestException(
        'El título y la descripción no pueden ser idénticos.',
      );
    }

    // Validar que el título o la descripción no se repitan en otras consultas DEL MISMO CURSO
    const existingConsulta = await this.prisma.consulta.findFirst({
      where: {
        idCurso, // <--- IMPORTANTE: Filtramos por el curso actual
        OR: [{ titulo: titulo }, { descripcion: descripcion }],
      },
    });

    if (existingConsulta) {
      if (existingConsulta.titulo === titulo) {
        throw new ConflictException('Ya existe una consulta con ese título.');
      }
      if (existingConsulta.descripcion === descripcion) {
        throw new ConflictException(
          'Ya existe una consulta con esa descripción.',
        );
      }
    }

    try {
      // 1. Crear la consulta
      const nuevaConsulta = await this.prisma.consulta.create({
        data: {
          titulo: titulo,
          descripcion: descripcion,
          tema: tema,
          fechaConsulta: new Date(fechaConsulta),
          idAlumno,
          idCurso,
          estado: estado_consulta.Pendiente,
        },
      });

      // --- NOTIFICACIÓN A DOCENTES ---
      // Obtenemos datos del alumno y curso para el correo
      const alumno = await this.prisma.usuario.findUnique({
        where: { id: idAlumno },
        select: { nombre: true, apellido: true },
      });
      const curso = await this.prisma.curso.findUnique({
        where: { id: idCurso },
        select: { nombre: true },
      });
      // Buscamos docentes activos
      const docentes = await this.prisma.docenteCurso.findMany({
        where: { idCurso, estado: 'Activo' },
        include: { docente: true },
      });

      if (alumno && curso) {
        this.mailService.enviarNuevaConsultaDocente(
          docentes.map((d) => ({
            email: d.docente.email,
            nombre: d.docente.nombre,
          })),
          {
            nombreAlumno: `${alumno.nombre} ${alumno.apellido}`,
            nombreCurso: curso.nombre,
            tema: tema,
            titulo: titulo,
            descripcion: descripcion,
            idCurso,
          },
        );
      }

      // --- INICIO PROCESO AUTOMATIZADO ---
      // Verificamos si llegamos al umbral para disparar la clase automática
      const conteoPendientes = await this.prisma.consulta.count({
        where: {
          idCurso: idCurso,
          estado: estado_consulta.Pendiente,
          deletedAt: null,
        },
      });

      // 3. Verificar Umbral (10 consultas)
      if (conteoPendientes >= 10) {
        this.logger.log(
          `Umbral alcanzado (${conteoPendientes} consultas) en curso ${idCurso}. Disparando proceso automático...`,
        );
        // Ejecutamos sin await para no bloquear la respuesta al alumno
        this.generarClaseAutomatica(idCurso).catch((err) =>
          this.logger.error('Error generando clase automática', err),
        );
      }
      // --- FIN PROCESO AUTOMATIZADO ---

      return nuevaConsulta;
    } catch (error) {
      console.error('Error en createConsulta:', error);
      throw new InternalServerErrorException('Error al crear la consulta.');
    }
  }

  // --- 2. SERVICIO DE RESPUESTA (DOCENTE) ---
  async createRespuesta(
    idConsulta: string,
    idDocente: string,
    dto: CreateRespuestaDto,
  ) {
    const { descripcion } = dto;
    try {
      // Usamos una transacción para asegurar que ambas cosas ocurran
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Creamos la Respuesta
          await tx.respuestaConsulta.create({
            data: {
              descripcion: descripcion,
              idDocente: idDocente,
              idConsulta: idConsulta,
              fechaRespuesta: new Date(),
            },
          });

          // 2. Actualizamos el estado de la Consulta
          const consultaActualizada = await tx.consulta.update({
            where: { id: idConsulta },
            data: {
              estado: estado_consulta.Revisada,
            },
          });

          // --- NOTIFICACIÓN AL ALUMNO ---
          const consulta = await tx.consulta.findUnique({
            where: { id: idConsulta },
            include: { alumno: true, curso: true },
          });
          const docente = await tx.usuario.findUnique({
            where: { id: idDocente },
          });

          if (consulta && docente) {
            this.mailService.enviarConsultaRespondidaAlumno({
              email: consulta.alumno.email,
              nombreAlumno: consulta.alumno.nombre,
              nombreDocente: `${docente.nombre} ${docente.apellido}`,
              tituloConsulta: consulta.titulo,
              respuesta: descripcion,
              idCurso: consulta.idCurso,
            });
          }

          return consultaActualizada;
        },
      );
    } catch (error) {
      // Manejamos si la consulta no existe
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2025' || error.code === 'P2003')
      ) {
        throw new NotFoundException('Consulta no encontrada.');
      }
      console.error('Error en createRespuesta:', error);
      throw new InternalServerErrorException('Error al enviar la respuesta.');
    }
  }

  // --- 3. SERVICIO DE VALORACIÓN (ALUMNO) ---
  async valorarConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: ValorarConsultaDto,
  ) {
    const { valoracion, comentarioValoracion } = dto;

    try {
      const consulta = await this.prisma.consulta.findUnique({
        where: { id: idConsulta },
        select: { idAlumno: true, estado: true },
      });

      if (!consulta) {
        throw new NotFoundException('Consulta no encontrada.');
      }

      if (consulta.idAlumno !== idAlumno) {
        throw new ForbiddenException('No puedes valorar esta consulta.');
      }

      if (consulta.estado !== estado_consulta.Revisada) {
        throw new ForbiddenException(
          'Solo puedes valorar consultas respondidas.',
        );
      }

      // Actualizamos. El trigger captura el cambio.
      const consultaActualizada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: {
          valoracionAlumno: valoracion,
          comentarioValoracion: comentarioValoracion,
          estado: estado_consulta.Resuelta,
        },
      });

      return consultaActualizada;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof ForbiddenException) throw error;
      console.error('Error en valorarConsulta:', error);
      throw new InternalServerErrorException('Error al valorar la consulta.');
    }
  }

  // --- 4. SERVICIO DE LECTURA (ALUMNO) ---
  async findConsultasForAlumno(
    idAlumno: string,
    idCurso: string,
    dto: FindConsultasDto, // <-- 2. Usar el DTO
  ) {
    const {
      page,
      limit,
      sort,
      order,
      tema,
      estado,
      search,
      fechaDesde,
      fechaHasta,
    } = dto;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ConsultaWhereInput = {
      idAlumno,
      idCurso,
      ...(tema && { tema: tema }),
      ...(estado && { estado: estado }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((fechaDesde || fechaHasta) && {
        fechaConsulta: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta) }),
        },
      }),
    };

    const orderBy: Prisma.ConsultaOrderByWithRelationInput = {
      [sort || 'fechaConsulta']: order || 'desc',
    };

    try {
      // 3. Usamos $transaction para paginación (igual que en UsersPage)
      const [consultas, total] = await this.prisma.$transaction([
        this.prisma.consulta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            respuestaConsulta: {
              include: {
                docente: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        }),
        this.prisma.consulta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: consultas, total, page, totalPages };
    } catch (error) {
      console.error('Error en findConsultasForAlumno:', error);
      throw new InternalServerErrorException('Error al obtener las consultas.');
    }
  }

  // --- 6. SERVICIO DE LECTURA (PÚBLICAS PARA ALUMNOS) ---
  async findConsultasPublicas(idCurso: string, dto: FindConsultasDto) {
    const { page, limit, sort, order, tema, search, fechaDesde, fechaHasta } =
      dto;
    // Nota: Ignoramos el filtro de 'estado' intencionalmente para la vista pública general,
    // o podríamos permitirlo si se desea. Por ahora, traemos todas las no borradas.

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ConsultaWhereInput = {
      idCurso,
      deletedAt: null,
      ...(tema && { tema: tema }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((fechaDesde || fechaHasta) && {
        fechaConsulta: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta) }),
        },
      }),
    };

    const orderBy: Prisma.ConsultaOrderByWithRelationInput = {
      [sort || 'fechaConsulta']: order || 'desc',
    };

    try {
      const [consultas, total] = await this.prisma.$transaction([
        this.prisma.consulta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            alumno: {
              select: { nombre: true, apellido: true },
            },
            respuestaConsulta: {
              include: {
                docente: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        }),
        this.prisma.consulta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: consultas, total, page, totalPages };
    } catch (error) {
      console.error('Error en findConsultasPublicas:', error);
      throw new InternalServerErrorException(
        'Error al obtener las consultas públicas.',
      );
    }
  }

  // --- 5. SERVICIO DE LECTURA (DOCENTE) (Refactorizado) ---
  async findConsultasForDocente(
    idCurso: string,
    dto: FindConsultasDto, // <-- 2. Usar el DTO
  ) {
    const {
      page,
      limit,
      sort,
      order,
      tema,
      estado,
      search,
      fechaDesde,
      fechaHasta,
    } = dto;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ConsultaWhereInput = {
      idCurso,
      deletedAt: null,
      ...(tema && { tema: tema }),
      ...(estado && { estado: estado }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((fechaDesde || fechaHasta) && {
        fechaConsulta: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta) }),
        },
      }),
    };

    const orderBy: Prisma.ConsultaOrderByWithRelationInput = {
      [sort || 'fechaConsulta']: order || 'desc',
    };

    try {
      // 3. Usamos $transaction
      const [consultas, total] = await this.prisma.$transaction([
        this.prisma.consulta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            alumno: {
              select: { nombre: true, apellido: true },
            },
            respuestaConsulta: {
              include: {
                docente: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        }),
        this.prisma.consulta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: consultas, total, page, totalPages };
    } catch (error) {
      console.error('Error en findConsultasForDocente:', error);
      throw new InternalServerErrorException('Error al obtener las consultas.');
    }
  }

  async updateConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: UpdateConsultaDto,
  ) {
    // Validar que el título y la descripción no sean iguales si ambos están presentes
    if (
      dto.titulo &&
      dto.descripcion &&
      dto.titulo.toLowerCase() === dto.descripcion.toLowerCase()
    ) {
      throw new BadRequestException(
        'El título y la descripción no pueden ser idénticos.',
      );
    }

    try {
      // 1. Validar permisos (dueño, pendiente y no borrado) Y OBTENER DATOS
      // Modificamos el helper para que nos devuelva la consulta y así saber su idCurso
      const consultaActual = await this.checkConsultaOwnershipAndState(
        idConsulta,
        idAlumno,
      );

      // 2. Validar duplicados (AHORA CONTEXTUALIZADO AL CURSO)
      const orConditions: Prisma.ConsultaWhereInput[] = [];
      if (dto.titulo) {
        orConditions.push({ titulo: dto.titulo });
      }
      if (dto.descripcion) {
        orConditions.push({ descripcion: dto.descripcion });
      }

      if (orConditions.length > 0) {
        const existingConsulta = await this.prisma.consulta.findFirst({
          where: {
            id: { not: idConsulta }, // Excluimos la consulta actual
            idCurso: consultaActual.idCurso, // <--- IMPORTANTE: Usamos el curso de la consulta
            OR: orConditions,
          },
        });

        if (existingConsulta) {
          const field =
            dto.titulo && existingConsulta.titulo === dto.titulo
              ? 'título'
              : 'descripción';
          throw new ConflictException(
            `Ya existe otra consulta con ese ${field} en este curso.`,
          );
        }
      }

      // 3. Actualizar (El trigger de auditoría captura esto)
      const consultaActualizada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: dto,
      });

      return consultaActualizada;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      )
        throw error;
      console.error('Error en updateConsulta:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la consulta.',
      );
    }
  }

  // --- ¡MÉTODO DE BORRADO (ACTUALIZADO A SOFT DELETE)! ---
  async deleteConsulta(idConsulta: string, idAlumno: string) {
    try {
      // 1. Validar permisos (dueño, pendiente y no borrado)
      await this.checkConsultaOwnershipAndState(idConsulta, idAlumno);

      // 2. Hacer "soft delete" (actualizar 'deletedAt')
      // El trigger de auditoría registrará esto como un 'UPDATE'
      const consultaBorrada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: {
          deletedAt: new Date(), // <-- Marcamos como borrado
        },
      });

      return consultaBorrada;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Error en deleteConsulta:', error);
      throw new InternalServerErrorException('Error al borrar la consulta.');
    }
  }

  /**
   * Obtiene solo las consultas 'Pendientes' de un curso (para el formulario)
   */
  async findPendingConsultasByCurso(idCurso: string) {
    return this.prisma.consulta.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_consulta.Pendiente,
        deletedAt: null,
      },
      select: {
        id: true,
        titulo: true,
        tema: true,
        descripcion: true,
        fechaConsulta: true,
        // (Incluimos el alumno para que el docente vea de quién es)
        alumno: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: {
        fechaConsulta: 'asc',
      },
    });
  }

  // --- HELPER DE PERMISOS (Sigue igual) ---
  private async checkConsultaOwnershipAndState(
    idConsulta: string,
    idAlumno: string,
  ) {
    const consulta = await this.prisma.consulta.findFirst({
      where: {
        id: idConsulta,
        idAlumno: idAlumno,
        deletedAt: null, // <-- Importante: no se puede editar/borrar algo ya borrado
      },
    });

    if (!consulta) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta consulta.',
      );
    }

    if (consulta.estado !== estado_consulta.Pendiente) {
      throw new ForbiddenException(
        'No puedes modificar una consulta que ya fue respondida o está resuelta.',
      );
    }

    return consulta; // <--- Devolvemos la consulta para usar sus datos (ej: idCurso)
  }

  private async generarClaseAutomatica(idCurso: string) {
    // 1. Evitar duplicados: Verificar si ya existe una clase pendiente de asignación
    // o programada futura para no spammear.
    const clasePendiente = await this.prisma.claseConsulta.findFirst({
      where: {
        idCurso: idCurso,
        estadoClase: { in: ['Pendiente_Asignacion', 'Programada'] },
        fechaInicio: { gte: new Date() }, // Futura
        deletedAt: null,
      },
    });

    if (clasePendiente) {
      this.logger.log(
        'Ya existe una clase pendiente/programada. Se omite creación.',
      );
      return;
    }

    // 2. Obtener configuración del curso (Días de clase y modalidad pref)
    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
      include: { diasClase: true },
    });

    if (!curso || !curso.diasClase.length) {
      this.logger.warn(
        'El curso no tiene días de clase configurados. No se puede agendar.',
      );
      return;
    }

    // 3. Calcular fecha de la consulta automática
    // El helper ya devuelve la fecha de INICIO de la consulta (1 hora antes de la clase)
    const fechaInicioConsulta = calcularFechaProximaClase(curso.diasClase);

    if (!fechaInicioConsulta) {
      this.logger.warn('No se pudo calcular una fecha próxima válida.');
      return;
    }

    // --- CORRECCIÓN DE HORARIOS (Spec: 1 hora antes de la cursada) ---
    // Si la cursada es a las 09:00, la consulta debe ser 08:00 - 09:00
    const horaInicio = new Date(fechaInicioConsulta);
    const horaFin = new Date(fechaInicioConsulta);
    horaFin.setHours(horaFin.getHours() + 1);
    // ----------------------------------------------------------------

    // 4. Obtener las 10 consultas más antiguas para asignar
    const consultasAAtender = await this.prisma.consulta.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_consulta.Pendiente,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' }, // Prioridad a las viejas
      take: 10,
      select: { id: true },
    });

    if (consultasAAtender.length < 10) return; // Doble check

    // 5. Crear la Clase Automática
    const claseCreada = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const nuevaClase = await tx.claseConsulta.create({
          data: {
            idCurso: idCurso,
            // idDocente: null (Pendiente)
            nombre: 'Clase de Consulta Automática',
            descripcion:
              'Generada automáticamente por acumulación de consultas.',
            fechaInicio: horaInicio,
            fechaFin: horaFin,
            modalidad: curso.modalidadPreferencial,
            estadoClase: estado_clase_consulta.Pendiente_Asignacion,
          },
        });

        // B. Vincular y actualizar consultas
        for (const consulta of consultasAAtender) {
          // Relación N-M
          await tx.consultaClase.create({
            data: { idClaseConsulta: nuevaClase.id, idConsulta: consulta.id },
          });

          // Cambiar estado de la consulta
          await tx.consulta.update({
            where: { id: consulta.id },
            data: { estado: estado_consulta.A_revisar },
          });
        }

        this.logger.log(
          `Clase automática creada con éxito: ${nuevaClase.id} (Sin docente asignado)`,
        );
        return nuevaClase;
      },
    );

    // 6. Usamos 'claseCreada' para los emails
    // --- AGREGAMOS EL ENVÍO DE EMAILS ---
    if (claseCreada) {
      // Fuera de la transacción para no bloquearla si el SMTP tarda

      // A. Buscamos a TODOS los docentes activos del curso
      const docentesDelCurso = await this.prisma.docenteCurso.findMany({
        where: { idCurso: idCurso, estado: 'Activo' },
        include: { docente: true }, // Traemos usuario para email y nombre
      });

      if (docentesDelCurso.length > 0) {
        const destinatarios = docentesDelCurso.map((d) => ({
          email: d.docente.email,
          nombre: d.docente.nombre,
        }));

        // B. Llamamos al servicio de mail
        this.mailService
          .enviarAvisoClaseAutomatica(destinatarios, {
            nombreCurso: curso.nombre,
            fechaOriginal: horaInicio,
            cantidadConsultas: consultasAAtender.length,
            idClase: claseCreada.id,
            diasClaseConfig: curso.diasClase,
          })
          .catch((err) =>
            this.logger.error('Error enviando notificaciones', err),
          );
      }
    }
  }
}
