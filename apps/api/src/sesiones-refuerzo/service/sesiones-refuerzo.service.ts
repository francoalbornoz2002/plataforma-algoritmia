import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DiaClase,
  dias_semana,
  estado_sesion,
  grado_dificultad,
  Prisma,
  roles,
  fuente_cambio_dificultad,
} from '@prisma/client';
import { getDiaSemanaEnum } from 'src/helpers';
import { FindAllSesionesDto } from '../dto/find-all-sesiones.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { ResolverSesionDto } from '../dto/resolver-sesion.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PreguntasService } from '../../preguntas/services/preguntas.service';
import { MailService } from '../../mail/services/mail.service';
import { DifficultiesService } from '../../difficulties/services/difficulties.service';
import {
  checkAlumnoAccess,
  checkDocenteAccess,
} from 'src/helpers/access.helper';

@Injectable()
export class SesionesRefuerzoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preguntasService: PreguntasService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => DifficultiesService))
    private readonly difficultiesService: DifficultiesService,
  ) {}

  async create(
    idCurso: string,
    dto: CreateSesionesRefuerzoDto,
    idDocente: string,
  ) {
    const {
      idAlumno,
      idDificultad,
      gradoSesion,
      fechaHoraLimite,
      tiempoLimite,
      preguntas,
    } = dto;

    // 1. Validar que el alumno no tenga otra sesión pendiente en el mismo curso.
    const sesionPendiente = await this.prisma.sesionRefuerzo.findFirst({
      where: {
        idAlumno,
        idCurso,
        estado: estado_sesion.Pendiente,
        deletedAt: null,
        idDocente: { not: null }, // Solo validamos si ya tiene una sesión asignada por DOCENTE
      },
    });

    if (sesionPendiente) {
      throw new ConflictException(
        'El alumno ya tiene una sesión de refuerzo asignada por un docente pendiente en este curso.',
      );
    }

    // 2. Validaciones de fecha y hora.
    const ahora = new Date();
    const fechaLimite = new Date(fechaHoraLimite);
    const limiteSuperior = new Date();
    limiteSuperior.setDate(ahora.getDate() + 7);

    if (fechaLimite <= ahora) {
      throw new BadRequestException(
        'La fecha y hora límite no puede ser anterior o igual a la actual.',
      );
    }

    if (fechaLimite > limiteSuperior) {
      throw new BadRequestException(
        'La fecha y hora límite no puede ser posterior a 7 días desde hoy.',
      );
    }

    // --- Transacción para el resto de validaciones y la creación ---
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 3. Validar accesos de docente y alumno al curso.
      await checkDocenteAccess(tx, idDocente, idCurso);
      await checkAlumnoAccess(tx, idAlumno, idCurso);

      // 4. Validar que las preguntas existan y cumplan las reglas de negocio.
      const preguntasDb = await tx.pregunta.findMany({
        where: {
          id: { in: preguntas },
          deletedAt: null,
        },
        select: {
          id: true,
          idDocente: true,
          idDificultad: true,
          gradoDificultad: true,
        },
      });

      if (preguntasDb.length !== preguntas.length) {
        throw new BadRequestException(
          'Una o más preguntas no se encontraron o fueron eliminadas.',
        );
      }

      // 4.1. Validar que todas las preguntas pertenezcan a la dificultad de la sesión.
      const todasMismaDificultad = preguntasDb.every(
        (p) => p.idDificultad === idDificultad,
      );
      if (!todasMismaDificultad) {
        throw new BadRequestException(
          'Todas las preguntas deben pertenecer a la dificultad seleccionada para la sesión.',
        );
      }

      // 4.2. Separar preguntas de sistema y extra, y validar cantidad de extras.
      const systemPreguntas = preguntasDb.filter((p) => p.idDocente === null);
      const extraPreguntas = preguntasDb.filter((p) => p.idDocente !== null);

      if (extraPreguntas.length > 3) {
        throw new BadRequestException(
          'Se pueden agregar hasta un máximo de 3 preguntas extra (creadas por docentes).',
        );
      }

      // 4.3. Validar la cantidad de preguntas de sistema según el grado de la sesión.
      const countByGrado = (grado: grado_dificultad) =>
        systemPreguntas.filter((p) => p.gradoDificultad === grado).length;

      const bajoCount = countByGrado(grado_dificultad.Bajo);
      const medioCount = countByGrado(grado_dificultad.Medio);
      const altoCount = countByGrado(grado_dificultad.Alto);

      if (
        (gradoSesion === grado_dificultad.Bajo && bajoCount !== 5) ||
        (gradoSesion === grado_dificultad.Medio &&
          (bajoCount !== 5 || medioCount !== 5)) ||
        (gradoSesion === grado_dificultad.Alto &&
          (bajoCount !== 5 || medioCount !== 5 || altoCount !== 5))
      ) {
        throw new BadRequestException(
          `La cantidad de preguntas de sistema no coincide con los requisitos para el grado "${gradoSesion}".`,
        );
      }

      // 5. Validar superposición con horario de cursada.
      await this.validarSuperposicionConClaseCurso(tx, idCurso, fechaLimite);

      // 6. Obtener el último número de sesión para el curso y calcular el siguiente.
      const ultimaSesion = await tx.sesionRefuerzo.findFirst({
        where: { idCurso },
        orderBy: { nroSesion: 'desc' },
      });

      const nroSesion = ultimaSesion ? ultimaSesion.nroSesion + 1 : 1;

      // 7. Crear la sesión de refuerzo.
      const nuevaSesion = await tx.sesionRefuerzo.create({
        data: {
          idCurso,
          idAlumno,
          idDificultad,
          gradoSesion,
          idDocente, // Docente que la crea. Puede ser null si es automática.
          nroSesion,
          fechaHoraLimite: fechaLimite,
          tiempoLimite,
          estado: estado_sesion.Pendiente,
        },
      });

      // 8. Vincular las preguntas a la sesión.
      await tx.preguntaSesion.createMany({
        data: preguntas.map((idPregunta) => ({
          idSesion: nuevaSesion.id,
          idPregunta: idPregunta,
        })),
      });

      // --- NOTIFICACIÓN AL ALUMNO ---
      const alumno = await tx.usuario.findUnique({ where: { id: idAlumno } });
      const docente = await tx.usuario.findUnique({ where: { id: idDocente } });
      const curso = await tx.curso.findUnique({ where: { id: idCurso } });
      const dificultad = await tx.dificultad.findUnique({
        where: { id: idDificultad },
      });

      if (alumno && docente && curso && dificultad) {
        this.mailService.enviarSesionAsignadaAlumno({
          email: alumno.email,
          nombreAlumno: alumno.nombre,
          nombreDocente: `${docente.nombre} ${docente.apellido}`,
          nombreCurso: curso.nombre,
          dificultad: dificultad.nombre,
          grado: gradoSesion,
          fechaLimite: fechaLimite,
          tiempoLimite: tiempoLimite,
        });
      }

      return nuevaSesion;
    });
  }

  /**
   * Crea una sesión de refuerzo automática cuando un alumno alcanza grado ALTO.
   */
  async createAutomaticSession(
    idCurso: string,
    idAlumno: string,
    idDificultad: string,
  ) {
    // 1. Validar si ya existe una sesión pendiente para este alumno y dificultad
    // para evitar spam de sesiones.
    const sesionExistente = await this.prisma.sesionRefuerzo.findFirst({
      where: {
        idCurso,
        idAlumno,
        idDificultad,
        estado: estado_sesion.Pendiente,
        deletedAt: null,
      },
    });

    if (sesionExistente) {
      // Ya tiene una sesión pendiente para esta dificultad, no creamos otra.
      return;
    }

    // 2. Obtener configuración del curso (Días de clase) para calcular fecha límite
    const diasClase = await this.prisma.diaClase.findMany({
      where: { idCurso },
    });

    const fechaLimite = this.calcularFechaLimiteAutomatica(diasClase);

    // 3. Obtener las 15 preguntas (5 Alto, 5 Medio, 5 Bajo)
    // Usamos el servicio de preguntas que ya tiene esta lógica.
    const preguntas = await this.preguntasService.findSystemPreguntasForSesion(
      idDificultad,
      grado_dificultad.Alto,
    );

    if (preguntas.length === 0) {
      console.warn(
        `No se pudieron encontrar preguntas para generar sesión automática. Curso: ${idCurso}, Dificultad: ${idDificultad}`,
      );
      return;
    }

    // 4. Crear la sesión
    const nuevaSesion = await this.prisma.$transaction(async (tx) => {
      // Calcular nroSesion
      const ultimaSesion = await tx.sesionRefuerzo.findFirst({
        where: { idCurso },
        orderBy: { nroSesion: 'desc' },
      });
      const nroSesion = ultimaSesion ? ultimaSesion.nroSesion + 1 : 1;

      const sesion = await tx.sesionRefuerzo.create({
        data: {
          idCurso,
          idAlumno,
          idDificultad,
          gradoSesion: grado_dificultad.Alto, // Se genera por alcanzar grado Alto
          idDocente: null, // Es automática
          nroSesion,
          fechaHoraLimite: fechaLimite,
          tiempoLimite: 20, // 20 minutos fijos según especificación
          estado: estado_sesion.Pendiente,
        },
      });

      // Vincular preguntas
      await tx.preguntaSesion.createMany({
        data: preguntas.map((p) => ({
          idSesion: sesion.id,
          idPregunta: p.id,
        })),
      });

      return sesion;
    });

    // 5. Enviar notificación por correo
    const alumno = await this.prisma.usuario.findUnique({
      where: { id: idAlumno },
    });
    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
    });
    const dificultad = await this.prisma.dificultad.findUnique({
      where: { id: idDificultad },
    });

    if (alumno && curso && dificultad) {
      await this.mailService.enviarNotificacionSesionAutomatica({
        email: alumno.email,
        nombreAlumno: alumno.nombre,
        nombreCurso: curso.nombre,
        nombreDificultad: dificultad.nombre,
        fechaLimite: fechaLimite,
      });
    }

    return nuevaSesion;
  }

  async findAll(idCurso: string, user: UserPayload, dto: FindAllSesionesDto) {
    const {
      page = 1,
      limit = 10,
      sort = 'nroSesion',
      order = 'desc',
      nroSesion,
      idAlumno,
      idDocente,
      idDificultad,
      gradoSesion,
      estado,
      fechaDesde,
      fechaHasta,
    } = dto;

    const skip = (page - 1) * limit;

    // 1. Validar acceso al curso
    if (user.rol === roles.Docente) {
      await checkDocenteAccess(this.prisma, user.userId, idCurso);
    } else {
      await checkAlumnoAccess(this.prisma, user.userId, idCurso);
    }

    // 2. Construir la cláusula WHERE
    const where: Prisma.SesionRefuerzoWhereInput = {
      idCurso,
      deletedAt: null,
    };

    // Filtro por rol: Alumno solo ve sus sesiones.
    if (user.rol === roles.Alumno) {
      where.idAlumno = user.userId;
    } else if (idAlumno) {
      // Docente puede filtrar por alumno
      where.idAlumno = idAlumno;
    }

    // Otros filtros
    if (nroSesion) where.nroSesion = nroSesion;
    if (idDocente) where.idDocente = idDocente;
    if (idDificultad) where.idDificultad = idDificultad;
    if (gradoSesion) where.gradoSesion = gradoSesion;
    if (estado) where.estado = estado;

    // Filtro por fecha de creación
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setDate(hasta.getDate() + 1); // Incluir todo el día
        where.createdAt.lt = hasta;
      }
    }

    // 3. Realizar las consultas a la BD en paralelo
    const [total, sesiones] = await this.prisma.$transaction([
      this.prisma.sesionRefuerzo.count({ where }),
      this.prisma.sesionRefuerzo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          alumno: { select: { id: true, nombre: true, apellido: true } },
          docente: { select: { id: true, nombre: true, apellido: true } },
          dificultad: { select: { id: true, nombre: true } },
          resultadoSesion: {
            include: {
              respuestasAlumno: true, // <-- AÑADIDO: Incluye siempre las respuestas del alumno
            },
          },
        },
      }),
    ]);

    // 4. Devolver la respuesta paginada
    const totalPages = Math.ceil(total / limit);
    return { data: sesiones, meta: { total, page, limit, totalPages } };
  }

  async findOne(idCurso: string, idSesion: string, user: UserPayload) {
    // 1. Validar acceso al curso
    if (user.rol === roles.Docente) {
      await checkDocenteAccess(this.prisma, user.userId, idCurso);
    } else {
      await checkAlumnoAccess(this.prisma, user.userId, idCurso);
    }

    // 2. Buscar la sesión con sus relaciones
    const sesion = await this.prisma.sesionRefuerzo.findUnique({
      where: {
        id: idSesion,
        idCurso,
      },
      include: {
        preguntas: {
          include: {
            pregunta: {
              include: {
                opcionesRespuesta: true,
              },
            },
          },
        },
        alumno: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        docente: { select: { id: true, nombre: true, apellido: true } },
        dificultad: { select: { id: true, nombre: true } },
        curso: { select: { id: true, nombre: true } },
        resultadoSesion: {
          include: {
            respuestasAlumno: true,
          },
        },
      },
    });

    // 3. Validar si la sesión existe y si el usuario tiene permiso para verla
    if (!sesion || sesion.deletedAt) {
      throw new NotFoundException('Sesión de refuerzo no encontrada.');
    }

    // Si el usuario es un alumno, solo puede ver sus propias sesiones
    if (user.rol === roles.Alumno && sesion.idAlumno !== user.userId) {
      throw new ForbiddenException('No tienes permiso para ver esta sesión.');
    }

    return sesion;
  }

  async update(
    idCurso: string,
    idSesion: string,
    dto: UpdateSesionesRefuerzoDto,
  ) {
    const {
      fechaHoraLimite,
      tiempoLimite,
      preguntas,
      idDificultad,
      gradoSesion,
    } = dto;

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'No se proporcionaron datos para actualizar.',
      );
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Obtener la sesión y validar su estado
      const sesion = await tx.sesionRefuerzo.findUnique({
        where: {
          id: idSesion,
          idCurso: idCurso,
          deletedAt: null,
        },
      });

      const otroAlumno = sesion?.idAlumno !== dto.idAlumno;

      if (otroAlumno) {
        throw new BadRequestException(
          'No se puede modificar el alumno de la sesión.',
        );
      }

      if (!sesion) {
        throw new NotFoundException('Sesión de refuerzo no encontrada.');
      }

      if (sesion.estado !== estado_sesion.Pendiente) {
        throw new ForbiddenException(
          'Solo se pueden modificar sesiones en estado "Pendiente".',
        );
      }

      if (new Date() >= sesion.fechaHoraLimite) {
        throw new ForbiddenException(
          'No se puede modificar una sesión cuya fecha límite ya ha pasado.',
        );
      }

      // 2. Validar y preparar datos para actualizar
      const dataToUpdate: Prisma.SesionRefuerzoUpdateInput = {};

      if (fechaHoraLimite) {
        const ahora = new Date();
        const fechaLimite = new Date(fechaHoraLimite);
        const limiteSuperior = new Date();
        limiteSuperior.setDate(ahora.getDate() + 7);

        if (fechaLimite <= ahora) {
          throw new BadRequestException(
            'La fecha y hora límite no puede ser anterior o igual a la actual.',
          );
        }
        if (fechaLimite > limiteSuperior) {
          throw new BadRequestException(
            'La fecha y hora límite no puede ser posterior a 7 días desde hoy.',
          );
        }
        await this.validarSuperposicionConClaseCurso(tx, idCurso, fechaLimite);
        dataToUpdate.fechaHoraLimite = fechaLimite;
      }

      if (typeof tiempoLimite !== 'undefined') {
        dataToUpdate.tiempoLimite = tiempoLimite;
      }

      if (idDificultad)
        dataToUpdate.dificultad = { connect: { id: idDificultad } };
      if (gradoSesion) dataToUpdate.gradoSesion = gradoSesion;

      // 3. Actualizar campos simples de la sesión
      if (Object.keys(dataToUpdate).length > 0) {
        await tx.sesionRefuerzo.update({
          where: { id: idSesion },
          data: dataToUpdate,
        });
      }

      // 4. Sincronizar preguntas si se proporcionan
      if (preguntas) {
        // 4.1. Determinar la dificultad y grado a validar
        const dificultadFinal = idDificultad || sesion.idDificultad;
        const gradoSesionFinal = gradoSesion || sesion.gradoSesion;

        // 4.2. Validar el nuevo conjunto de preguntas
        const newPreguntasDb = await tx.pregunta.findMany({
          where: { id: { in: preguntas }, deletedAt: null },
          select: {
            id: true,
            idDocente: true,
            idDificultad: true,
            gradoDificultad: true,
          },
        });

        if (newPreguntasDb.length !== preguntas.length) {
          throw new BadRequestException(
            'Una o más de las nuevas preguntas no se encontraron o fueron eliminadas.',
          );
        }

        // 4.2.1. Validar que todas las preguntas pertenezcan a la dificultad de la sesión.
        const todasMismaDificultad = newPreguntasDb.every(
          (p) => p.idDificultad === dificultadFinal,
        );
        if (!todasMismaDificultad) {
          throw new BadRequestException(
            'Todas las preguntas deben pertenecer a la dificultad seleccionada para la sesión.',
          );
        }

        // 4.2.2. Separar preguntas de sistema y extra, y validar cantidad de extras.
        const systemPreguntas = newPreguntasDb.filter(
          (p) => p.idDocente === null,
        );
        const extraPreguntas = newPreguntasDb.filter(
          (p) => p.idDocente !== null,
        );

        if (extraPreguntas.length > 3) {
          throw new BadRequestException(
            'Se pueden agregar hasta un máximo de 3 preguntas extra (creadas por docentes).',
          );
        }

        // 4.2.3. Validar la cantidad de preguntas de sistema según el grado de la sesión.
        const countByGrado = (grado: grado_dificultad) =>
          systemPreguntas.filter((p) => p.gradoDificultad === grado).length;

        const bajoCount = countByGrado(grado_dificultad.Bajo);
        const medioCount = countByGrado(grado_dificultad.Medio);
        const altoCount = countByGrado(grado_dificultad.Alto);

        if (
          (gradoSesionFinal === grado_dificultad.Bajo && bajoCount !== 5) ||
          (gradoSesionFinal === grado_dificultad.Medio &&
            (bajoCount !== 5 || medioCount !== 5)) ||
          (gradoSesionFinal === grado_dificultad.Alto &&
            (bajoCount !== 5 || medioCount !== 5 || altoCount !== 5))
        ) {
          throw new BadRequestException(
            `La cantidad de preguntas de sistema no coincide con los requisitos para el grado "${gradoSesionFinal}".`,
          );
        }

        // 4.3. Reemplazar todas las preguntas
        await tx.preguntaSesion.deleteMany({
          where: { idSesion },
        });

        if (preguntas.length > 0) {
          await tx.preguntaSesion.createMany({
            data: preguntas.map((idPregunta) => ({
              idSesion,
              idPregunta,
            })),
          });
        }
      }

      // 5. Devolver la sesión actualizada
      return tx.sesionRefuerzo.findUnique({
        where: { id: idSesion },
        include: {
          preguntas: {
            include: {
              pregunta: {
                include: {
                  opcionesRespuesta: true,
                },
              },
            },
          },
          alumno: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          docente: { select: { id: true, nombre: true, apellido: true } },
          curso: { select: { id: true, nombre: true } },
          resultadoSesion: true,
        },
      });
    });
  }

  async remove(
    idCurso: string,
    idSesion: string,
    externalTx?: Prisma.TransactionClient,
  ) {
    // Función auxiliar con la lógica de negocio
    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Obtener la sesión
      const sesion = await tx.sesionRefuerzo.findUnique({
        where: {
          id: idSesion,
          idCurso: idCurso,
          deletedAt: null,
        },
      });

      if (!sesion) {
        throw new NotFoundException('Sesión de refuerzo no encontrada.');
      }

      // 2. Validar estado
      if (sesion.estado !== estado_sesion.Pendiente) {
        throw new ForbiddenException(
          'Solo se pueden cancelar sesiones en estado "Pendiente".',
        );
      }

      // 3. Validar que no haya pasado la fecha límite
      if (new Date() >= sesion.fechaHoraLimite) {
        throw new ForbiddenException(
          'No se puede cancelar una sesión cuya fecha límite ya ha pasado.',
        );
      }

      // 4. Realizar la baja lógica (cancelación)
      return tx.sesionRefuerzo.update({
        where: { id: idSesion },
        data: {
          estado: estado_sesion.Cancelada,
          deletedAt: new Date(),
        },
      });
    };

    if (externalTx) {
      return execute(externalTx);
    } else {
      return this.prisma.$transaction(execute);
    }
  }

  async iniciarSesion(idCurso: string, idSesion: string, idAlumno: string) {
    const sesion = await this.prisma.sesionRefuerzo.findUnique({
      where: { id: idSesion, idCurso },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión de refuerzo no encontrada.');
    }

    if (sesion.idAlumno !== idAlumno) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta sesión.',
      );
    }

    if (sesion.estado !== estado_sesion.Pendiente) {
      throw new BadRequestException('La sesión no está en estado pendiente.');
    }

    // Si ya se inició previamente, retornamos la sesión tal cual para no reiniciar el contador
    if (sesion.fechaInicioReal) {
      return sesion;
    }

    return this.prisma.sesionRefuerzo.update({
      where: { id: idSesion },
      data: {
        fechaInicioReal: new Date(),
        estado: estado_sesion.En_curso,
      },
    });
  }

  async resolverSesion(
    idCurso: string,
    idSesion: string,
    idAlumno: string,
    dto: ResolverSesionDto,
  ) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Obtener la sesión con sus preguntas y opciones correctas
      const sesion = await tx.sesionRefuerzo.findUnique({
        where: { id: idSesion, idCurso },
        include: {
          preguntas: {
            include: {
              pregunta: {
                include: {
                  opcionesRespuesta: true,
                },
              },
            },
          },
        },
      });

      if (!sesion) {
        throw new NotFoundException('Sesión de refuerzo no encontrada.');
      }

      if (sesion.idAlumno !== idAlumno) {
        throw new ForbiddenException(
          'No tienes permiso para resolver esta sesión.',
        );
      }

      if (
        sesion.estado !== estado_sesion.Pendiente &&
        sesion.estado !== estado_sesion.En_curso
      ) {
        throw new BadRequestException(
          'La sesión ya ha sido completada o cancelada.',
        );
      }

      // 2. Procesar Respuestas y Calcular Puntaje
      let correctas = 0;
      const respuestasToSave: Prisma.RespuestaAlumnoCreateManyInput[] = [];
      const preguntasMap = new Map(
        sesion.preguntas.map((p) => [p.idPregunta, p.pregunta]),
      );

      // Evitar duplicados en las respuestas enviadas por seguridad
      const respuestasUnicas = new Map();
      for (const r of dto.respuestas) {
        respuestasUnicas.set(r.idPregunta, r.idOpcionElegida);
      }

      for (const [idPregunta, idOpcionElegida] of respuestasUnicas.entries()) {
        const pregunta = preguntasMap.get(idPregunta);
        if (!pregunta) continue; // Ignorar preguntas que no son de esta sesión

        const opcionCorrecta = pregunta.opcionesRespuesta.find(
          (o) => o.esCorrecta,
        );
        const esCorrecta = opcionCorrecta?.id === idOpcionElegida;

        if (esCorrecta) {
          correctas++;
        }

        respuestasToSave.push({
          idSesion,
          idPregunta,
          idOpcionElegida,
          esCorrecta,
        });
      }

      const totalPreguntas = sesion.preguntas.length;
      const incorrectas = totalPreguntas - correctas;
      const pctAciertos =
        totalPreguntas > 0 ? (correctas / totalPreguntas) * 100 : 0;

      // 3. Actualizar Dificultad del Alumno (Lógica de Negocio)
      const gradoAnterior = sesion.gradoSesion;
      let nuevoGrado: grado_dificultad = grado_dificultad.Ninguno;

      if (pctAciertos < 40) nuevoGrado = grado_dificultad.Alto;
      else if (pctAciertos < 60) nuevoGrado = grado_dificultad.Medio;
      else if (pctAciertos < 85) nuevoGrado = grado_dificultad.Bajo;
      else nuevoGrado = grado_dificultad.Ninguno;

      // 3.1. Verificar estado actual para Historial
      const existingDifficulty = await tx.dificultadAlumno.findUnique({
        where: {
          idAlumno_idCurso_idDificultad: {
            idAlumno,
            idCurso,
            idDificultad: sesion.idDificultad,
          },
        },
      });

      const shouldUpdate =
        !existingDifficulty || existingDifficulty.grado !== nuevoGrado;

      if (shouldUpdate) {
        // Actualizamos o creamos la dificultad con el nuevo grado
        await tx.dificultadAlumno.upsert({
          where: {
            idAlumno_idCurso_idDificultad: {
              idAlumno,
              idCurso,
              idDificultad: sesion.idDificultad,
            },
          },
          update: { grado: nuevoGrado },
          create: {
            idAlumno,
            idCurso,
            idDificultad: sesion.idDificultad,
            grado: nuevoGrado,
          },
        });

        // Insertamos en el Historial
        await tx.historialDificultadAlumno.create({
          data: {
            idAlumno,
            idCurso,
            idDificultad: sesion.idDificultad,
            gradoAnterior: existingDifficulty
              ? existingDifficulty.grado
              : grado_dificultad.Ninguno,
            gradoNuevo: nuevoGrado,
            fechaCambio: new Date(),
            fuente: fuente_cambio_dificultad.SESION_REFUERZO,
          },
        });

        // 3.2. Recalcular KPIs del curso (Solo si hubo cambios)
        await this.difficultiesService.recalculateCourseDifficulties(
          tx,
          idCurso,
        );
      }

      // 4. Guardar Respuestas y Resultado
      // IMPORTANTE: Primero creamos el ResultadoSesion porque RespuestaAlumno tiene una FK que apunta a él.
      await tx.resultadoSesion.create({
        data: {
          idSesion,
          cantCorrectas: correctas,
          cantIncorrectas: incorrectas,
          pctAciertos,
          fechaCompletado: new Date(),
          gradoAnterior,
          gradoNuevo: nuevoGrado,
        },
      });

      if (respuestasToSave.length > 0) {
        await tx.respuestaAlumno.createMany({ data: respuestasToSave });
      }

      // 5. Finalizar Sesión
      await tx.sesionRefuerzo.update({
        where: { id: idSesion },
        data: { estado: estado_sesion.Completada },
      });

      return {
        mensaje: 'Sesión completada exitosamente.',
        resultados: {
          correctas,
          incorrectas,
          pctAciertos,
          nuevoGrado,
        },
      };
    });
  }

  /**
   * CRON JOB: Actualización automática de estados.
   * Se ejecuta cada minuto para verificar sesiones vencidas.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronSesionesVencidas() {
    const now = new Date();

    // 1. Caso: El tiempo límite pasó y el alumno NUNCA inició la sesión.
    // Estado -> No_realizada
    await this.prisma.sesionRefuerzo.updateMany({
      where: {
        estado: estado_sesion.Pendiente,
        fechaHoraLimite: { lt: now },
        fechaInicioReal: null,
        deletedAt: null,
      },
      data: {
        estado: estado_sesion.No_realizada,
      },
    });

    // 2. Caso: El tiempo límite pasó, el alumno estaba "En curso" pero NO envió respuestas.
    // Estado -> Incompleta
    await this.prisma.sesionRefuerzo.updateMany({
      where: {
        estado: estado_sesion.En_curso,
        fechaHoraLimite: { lt: now },
        fechaInicioReal: { not: null },
        deletedAt: null,
      },
      data: {
        estado: estado_sesion.Incompleta,
      },
    });
  }

  // --------------- HELPERS PRIVADOS --------------- //

  /**
   * Calcula la fecha límite para una sesión automática.
   * Regla: Día de la siguiente clase más próxima.
   * Excepción: Si se genera el mismo día de una clase (antes de su inicio), se pasa a la SIGUIENTE.
   */
  private calcularFechaLimiteAutomatica(diasClase: DiaClase[]): Date {
    const ahora = new Date();
    // Si no hay días de clase configurados, damos 7 días por defecto
    if (!diasClase || diasClase.length === 0) {
      const defaultDate = new Date();
      defaultDate.setDate(ahora.getDate() + 7);
      return defaultDate;
    }

    const mapaDias: Record<dias_semana, number> = {
      Lunes: 1,
      Martes: 2,
      Miercoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sabado: 6,
    };

    let candidatos: Date[] = [];

    // Buscamos en los próximos 21 días
    for (let i = 0; i < 21; i++) {
      const fechaFutura = new Date(ahora);
      fechaFutura.setDate(ahora.getDate() + i);
      const diaSemanaJS = fechaFutura.getDay();

      const clasesDelDia = diasClase.filter(
        (d) => mapaDias[d.dia] === diaSemanaJS,
      );

      for (const clase of clasesDelDia) {
        const horaInicio = new Date(clase.horaInicio);
        const fechaCandidata = new Date(fechaFutura);
        fechaCandidata.setHours(
          horaInicio.getHours(),
          horaInicio.getMinutes(),
          0,
          0,
        );

        // Regla: Debe ser estrictamente mayor a ahora.
        // Regla especial: Si es el MISMO día que ahora, lo saltamos (porque "antes de su inicio" implica hoy).
        const esMismoDia = fechaCandidata.getDate() === ahora.getDate();

        if (fechaCandidata > ahora && !esMismoDia) {
          candidatos.push(fechaCandidata);
        }
      }
    }

    candidatos.sort((a, b) => a.getTime() - b.getTime());
    return candidatos.length > 0 ? candidatos[0] : candidatos[0]; // Fallback
  }

  private async validarSuperposicionConClaseCurso(
    tx: Prisma.TransactionClient,
    idCurso: string,
    fechaHoraLimite: Date,
  ) {
    const diaEnum = getDiaSemanaEnum(fechaHoraLimite);
    if (!diaEnum) return; // No es un día de semana, no hay conflicto.

    const diasDeClase = await tx.diaClase.findMany({
      where: { idCurso, dia: diaEnum },
    });

    if (diasDeClase.length === 0) return; // No hay clases ese día.

    // Comparamos todo en UTC para evitar problemas de zona horaria.
    const limiteEnMinutos =
      fechaHoraLimite.getUTCHours() * 60 + fechaHoraLimite.getUTCMinutes();

    for (const claseCurso of diasDeClase) {
      const cursoInicioMin =
        claseCurso.horaInicio.getUTCHours() * 60 +
        claseCurso.horaInicio.getUTCMinutes();
      const cursoFinMin =
        claseCurso.horaFin.getUTCHours() * 60 +
        claseCurso.horaFin.getUTCMinutes();

      // Conflicto si la hora límite está entre el inicio de la clase y 1h después del fin.
      // Rango prohibido: (cursoInicioMin, cursoFinMin + 60)
      const isConflict =
        limiteEnMinutos > cursoInicioMin && limiteEnMinutos < cursoFinMin + 60;

      if (isConflict) {
        // Para el mensaje de error, mostramos la hora en formato local (asumiendo UTC-3)
        const offsetArg = 3;
        let horaInicioLocal = claseCurso.horaInicio.getUTCHours() - offsetArg;
        if (horaInicioLocal < 0) horaInicioLocal += 24;
        const inicioLegible = `${horaInicioLocal
          .toString()
          .padStart(2, '0')}:${claseCurso.horaInicio
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')}`;

        throw new BadRequestException(
          `Conflicto de horario: La hora límite no puede estar entre la hora de inicio de la clase (${inicioLegible}) y una hora después de su finalización.`,
        );
      }
    }
  }
}
