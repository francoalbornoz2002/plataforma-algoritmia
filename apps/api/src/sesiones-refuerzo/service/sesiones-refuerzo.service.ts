import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { estado_sesion, grado_dificultad, Prisma, roles } from '@prisma/client';
import { getDiaSemanaEnum } from 'src/helpers';
import { FindAllSesionesDto } from '../dto/find-all-sesiones.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';

@Injectable()
export class SesionesRefuerzoService {
  constructor(private readonly prisma: PrismaService) {}

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
      },
    });

    if (sesionPendiente) {
      throw new ConflictException(
        'El alumno ya tiene una sesión de refuerzo pendiente en este curso.',
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
      await this.checkDocenteAccess(tx, idDocente, idCurso);
      await this.checkAlumnoAccess(tx, idAlumno, idCurso);

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

      return nuevaSesion;
    });
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
    } = dto;

    const skip = (page - 1) * limit;

    // 1. Validar acceso al curso
    if (user.rol === roles.Docente) {
      await this.checkDocenteAccess(this.prisma, user.userId, idCurso);
    } else {
      await this.checkAlumnoAccess(this.prisma, user.userId, idCurso);
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
          resultadoSesion: true,
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
      await this.checkDocenteAccess(this.prisma, user.userId, idCurso);
    } else {
      await this.checkAlumnoAccess(this.prisma, user.userId, idCurso);
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
        resultadoSesion: true,
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

    if (dto.idAlumno) {
      throw new BadRequestException(
        'No se puede modificar el alumno de la sesión.',
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

  async remove(idCurso: string, idSesion: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
    });
  }

  // --------------- HELPERS PRIVADOS --------------- //

  private async checkDocenteAccess(
    tx: Prisma.TransactionClient | PrismaService,
    idDocente: string,
    idCurso: string,
  ) {
    const asignacion = await tx.docenteCurso.findFirst({
      where: { idDocente, idCurso, estado: 'Activo' },
    });
    if (!asignacion) {
      throw new ForbiddenException(
        'No tienes permisos para crear una sesión en este curso.',
      );
    }
  }

  private async checkAlumnoAccess(
    tx: Prisma.TransactionClient | PrismaService,
    idAlumno: string,
    idCurso: string,
  ) {
    const inscripcion = await tx.alumnoCurso.findFirst({
      where: { idAlumno, idCurso, estado: 'Activo' },
    });
    if (!inscripcion) {
      throw new ForbiddenException(
        'El alumno no está inscrito o activo en este curso.',
      );
    }
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
