import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  estado_clase_consulta,
  estado_consulta,
  estado_revision,
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
    const { page, limit, sort, order, tema, estado, search } = dto;
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

  // --- 5. SERVICIO DE LECTURA (DOCENTE) (Refactorizado) ---
  async findConsultasForDocente(
    idCurso: string,
    dto: FindConsultasDto, // <-- 2. Usar el DTO
  ) {
    const { page, limit, sort, order, tema, estado, search } = dto;
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
    try {
      // 1. Validar permisos (dueño, pendiente y no borrado)
      await this.checkConsultaOwnershipAndState(idConsulta, idAlumno);

      // 2. Actualizar (El trigger de auditoría captura esto)
      const consultaActualizada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: dto,
      });

      return consultaActualizada;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
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
  }

  private async generarClaseAutomatica(idCurso: string) {
    // 1. Evitar duplicados: Verificar si ya existe una clase pendiente de asignación
    // o programada futura para no spammear.
    const clasePendiente = await this.prisma.claseConsulta.findFirst({
      where: {
        idCurso: idCurso,
        estadoClase: { in: ['Pendiente_Asignacion', 'Programada'] },
        fechaClase: { gte: new Date() }, // Futura
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

    // 3. Calcular fecha usando el helper
    const fechaProxima = calcularFechaProximaClase(curso.diasClase);

    if (!fechaProxima) {
      this.logger.warn('No se pudo calcular una fecha próxima válida.');
      return;
    }

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

    // 5. Crear la Clase Automática. Creamos la clase sin 'idDocente'.
    const claseCreada = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // A. Crear la Clase (Sin docente asignado)
        const nuevaClase = await tx.claseConsulta.create({
          data: {
            idCurso: idCurso,
            // idDocente: null
            nombre: 'Clase de Consulta Automática',
            descripcion:
              'Generada automáticamente por acumulación de consultas.',
            fechaClase: fechaProxima,
            horaInicio: fechaProxima,
            horaFin: new Date(fechaProxima.getTime() + 60 * 60 * 1000), // 1 hora
            modalidad: curso.modalidadPreferencial,
            estadoClase: estado_clase_consulta.Pendiente_Asignacion,
            estadoRevision: estado_revision.Pendiente,
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
            fechaOriginal: fechaProxima,
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
