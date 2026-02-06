import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ActivityRange,
  AttemptsRange,
  FindStudentProgressDto,
  ProgressRange,
  StarsRange,
} from '../dto/find-student-progress.dto';
import { Prisma } from '@prisma/client';
import { SubmitMissionDto } from '../dto/submit-mission.dto';

const TOTAL_MISIONES_JUEGO = 10; // (Hardcodeado por ahora)

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * MÉTODO 1: Obtener el Resumen (KPIs) del Curso
   */
  async getCourseOverview(idCurso: string) {
    try {
      const curso = await this.prisma.curso.findUnique({
        where: { id: idCurso },
        select: {
          progresoCurso: true, // Seleccionamos la relación de progreso
        },
      });

      if (!curso || !curso.progresoCurso) {
        throw new NotFoundException('Progreso del curso no encontrado.');
      }
      // Convertimos los campos Decimal (que llegan como string) a Number (float)
      const progreso = curso.progresoCurso;
      return {
        ...progreso,
        pctMisionesCompletadas: parseFloat(
          progreso.pctMisionesCompletadas as any,
        ),
        promEstrellas: parseFloat(progreso.promEstrellas as any),
        promIntentos: parseFloat(progreso.promIntentos as any),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getCourseOverview:', error);
      throw new InternalServerErrorException(
        'Error al obtener el resumen del curso.',
      );
    }
  }

  /**
   * MÉTODO 2: Obtener la lista de alumnos para la DataGrid
   */
  async getStudentProgressList(idCurso: string, dto: FindStudentProgressDto) {
    const {
      page,
      limit,
      sort,
      order,
      search,
      progressRange,
      starsRange,
      attemptsRange,
      activityRange,
    } = dto;

    const skip = (page - 1) * limit;
    const take = limit;

    try {
      // 1. Construir el WHERE dinámicamente
      const where = this.buildWhereClause(
        idCurso,
        search,
        progressRange,
        starsRange,
        attemptsRange,
        activityRange,
      );

      // 2. Construir el ORDER BY dinámicamente
      const orderBy = this.buildOrderByClause(sort, order);

      // 3. Ejecutar las consultas en paralelo
      const [alumnos, total] = await this.prisma.$transaction([
        // Consulta para obtener los datos
        this.prisma.alumnoCurso.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            alumno: {
              select: { nombre: true, apellido: true },
            },
            // --- CAMBIO AQUÍ ---
            progresoAlumno: {
              include: {
                // Traemos las especiales
                misionesEspeciales: {
                  orderBy: { fechaCompletado: 'desc' },
                },
                // Y las normales con sus detalles
                misionesCompletadas: {
                  include: { mision: true },
                  orderBy: { fechaCompletado: 'desc' },
                },
              },
            },
            // -------------------
          },
        }),
        // Consulta para obtener el conteo total
        this.prisma.alumnoCurso.count({ where }),
      ]);

      // 4. Mapear la respuesta para el DataGrid
      // Mapear la respuesta y convertir los Decimal a Number
      const data = alumnos.map((ac) => ({
        ...ac.progresoAlumno,
        // ¡LA CORRECCIÓN!
        // El 'id' que viene de 'progresoAlumno' es el idProgreso.
        // Necesitamos añadir explícitamente el idAlumno.
        id: ac.progresoAlumno.id, // (Este es idProgreso)
        idAlumno: ac.idAlumno, // <-- AÑADIMOS EL ID DEL ALUMNO
        nombre: ac.alumno.nombre,
        apellido: ac.alumno.apellido,
        // Conversión de Decimal a Number
        pctMisionesCompletadas: parseFloat(
          ac.progresoAlumno.pctMisionesCompletadas as any,
        ),
        promEstrellas: parseFloat(ac.progresoAlumno.promEstrellas as any),
        promIntentos: parseFloat(ac.progresoAlumno.promIntentos as any),
      }));

      const totalPages = Math.ceil(total / limit);
      return { data, total, page, totalPages };
    } catch (error) {
      console.error('Error en getStudentProgressList:', error);
      throw new InternalServerErrorException(
        'Error al obtener el progreso de los alumnos.',
      );
    }
  }

  async getStudentProgress(idAlumno: string, idCurso: string) {
    try {
      // 1. Buscamos la inscripción específica
      const inscripcion = await this.prisma.alumnoCurso.findUnique({
        where: {
          idAlumno_idCurso: {
            idAlumno: idAlumno,
            idCurso: idCurso,
          },
        },
        // 2. Incluimos el progreso de esa inscripción y misiones
        include: {
          progresoAlumno: {
            include: {
              misionesEspeciales: {
                orderBy: { fechaCompletado: 'desc' },
              },
              misionesCompletadas: {
                include: { mision: true },
                orderBy: { fechaCompletado: 'desc' },
              },
            },
          },
        },
      });

      // 3. Validamos que exista
      if (!inscripcion || !inscripcion.progresoAlumno) {
        throw new NotFoundException(
          'No se encontró tu progreso para este curso.',
        );
      }

      // 4. Devolvemos solo el objeto de progreso
      const progreso = inscripcion.progresoAlumno;
      return {
        ...progreso,
        pctMisionesCompletadas: parseFloat(
          progreso.pctMisionesCompletadas as any,
        ),
        promEstrellas: parseFloat(progreso.promEstrellas as any),
        promIntentos: parseFloat(progreso.promIntentos as any),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getStudentProgress:', error);
      throw new InternalServerErrorException('Error al obtener tu progreso.');
    }
  }

  /**
   * Registra una misión completada y recalcula los progresos.
   * Esta es la lógica principal de tu Propuesta 2 y 3.
   */
  //async submitMission(dto: SubmitMissionDto) {
  //  const { idAlumno, idMision, estrellas, exp, intentos, fechaCompletado } =
  //    dto;
  //
  //  try {
  //    // 1. Validar que el alumno esté activo en un curso
  //    const inscripcion = await this.prisma.alumnoCurso.findFirst({
  //      where: {
  //        idAlumno: idAlumno,
  //        estado: 'Activo',
  //      },
  //      select: {
  //        idCurso: true,
  //        idProgreso: true, // El ID del ProgresoAlumno
  //      },
  //    });
  //
  //    if (!inscripcion) {
  //      throw new NotFoundException(
  //        'No se encontró una inscripción activa para este alumno.',
  //      );
  //    }
  //
  //    const { idProgreso, idCurso } = inscripcion;
  //
  //    // 2. Ejecutar todo como una transacción (como discutimos)
  //    return await this.prisma.$transaction(
  //      async (tx: Prisma.TransactionClient) => {
  //        // --- Paso A: Registrar la misión ---
  //        await tx.misionCompletada.create({
  //          data: {
  //            idMision: idMision,
  //            idProgreso: idProgreso, // ID de ProgresoAlumno
  //            estrellas: estrellas,
  //            exp: exp,
  //            intentos: intentos,
  //            fechaCompletado: new Date(fechaCompletado),
  //          },
  //        });
  //
  //        // --- Paso B: Actualizar ProgresoAlumno (Atómicamente) ---
  //        const progAlumnoActualizado = await tx.progresoAlumno.update({
  //          where: { id: idProgreso },
  //          data: {
  //            // Operaciones atómicas para evitar 'race conditions'
  //            totalEstrellas: { increment: estrellas },
  //            totalExp: { increment: exp },
  //            totalIntentos: { increment: intentos },
  //            cantMisionesCompletadas: { increment: 1 },
  //            ultimaActividad: new Date(), // TODO: Que la nueva ultima actividad sea la fecha de la ultima misión completada registrada
  //          },
  //        });
  //
  //        // --- Paso C: Recalcular Promedios (Alumno) ---
  //        // (Esto es seguro porque ocurre DENTRO de la transacción)
  //        const nuevoPromEstrellas =
  //          progAlumnoActualizado.totalEstrellas /
  //          progAlumnoActualizado.cantMisionesCompletadas;
  //        const nuevoPromIntentos =
  //          progAlumnoActualizado.totalIntentos /
  //          progAlumnoActualizado.cantMisionesCompletadas;
  //        const nuevoPctCompletadas =
  //          (progAlumnoActualizado.cantMisionesCompletadas /
  //            TOTAL_MISIONES_JUEGO) *
  //          100;
  //
  //        await tx.progresoAlumno.update({
  //          where: { id: idProgreso },
  //          data: {
  //            promEstrellas: nuevoPromEstrellas,
  //            promIntentos: nuevoPromIntentos,
  //            pctMisionesCompletadas: nuevoPctCompletadas,
  //          },
  //        });
  //
  //        // --- Paso D: Recalcular ProgresoCurso (Agregación) ---
  //        // Llamamos al helper para que actualice los KPIs del curso
  //        await this.recalculateCourseProgress(tx, idCurso);
  //
  //        return { message: 'Progreso registrado con éxito' };
  //      },
  //    );
  //  } catch (error) {
  //    if (error instanceof NotFoundException) throw error;
  //    if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //      // Error de constraint (ej: idMision no existe)
  //      if (error.code === 'P2003' || error.code === 'P2002') {
  //        throw new BadRequestException(
  //          'Datos inválidos (ej: Misión o Alumno no existen)',
  //        );
  //      }
  //    }
  //    console.error('Error en submitMission:', error);
  //    throw new InternalServerErrorException('Error al registrar el progreso.');
  //  }
  //}

  /**
   * Registra una o más misiones completadas y recalcula los progresos.
   */
  async submitMissions(dtos: SubmitMissionDto[]) {
    // 1. Validación de entrada
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException(
        'El lote de misiones no puede estar vacío.',
      );
    }

    // 2. Todos los DTOs deben ser del MISMO alumno
    const idAlumno = dtos[0].idAlumno;
    const todosDelMismoAlumno = dtos.every((dto) => dto.idAlumno === idAlumno);
    if (!todosDelMismoAlumno) {
      throw new BadRequestException(
        'Todas las misiones del lote deben pertenecer al mismo alumno.',
      );
    }

    try {
      // 3. Validar al alumno y obtener su progreso
      const inscripcion = await this.prisma.alumnoCurso.findFirst({
        where: { idAlumno: idAlumno, estado: 'Activo' },
        select: { idCurso: true, idProgreso: true },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'No se encontró una inscripción activa para este alumno.',
        );
      }

      const { idProgreso, idCurso } = inscripcion;

      // --- SEPARACIÓN DE LOTES ---
      const misionesNormales = dtos.filter((m) => !m.esMisionEspecial);
      const misionesEspeciales = dtos.filter((m) => m.esMisionEspecial);

      // 6. Ejecutar todo como una transacción
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          let totalEstrellasDelta = 0;
          let totalExpDelta = 0;
          let totalIntentosDelta = 0;
          let cantMisionesCompletadasDelta = 0;
          let ultimaActividadLote = new Date(0);

          // --- Paso A: Procesar Misiones NORMALES (Upsert manual) ---
          for (const mision of misionesNormales) {
            const fechaMision = new Date(mision.fechaCompletado);
            if (fechaMision > ultimaActividadLote) {
              ultimaActividadLote = fechaMision;
            }

            const existing = await tx.misionCompletada.findUnique({
              where: {
                idMision_idProgreso: {
                  idMision: mision.idMision,
                  idProgreso: idProgreso,
                },
              },
            });

            if (existing) {
              // LOGICA HIGH SCORE: Solo actualizamos si mejora estrellas o exp
              const esMejorPuntaje =
                mision.estrellas > existing.estrellas ||
                (mision.estrellas === existing.estrellas &&
                  mision.exp > existing.exp);

              if (esMejorPuntaje) {
                // Sobreescribir solo si es mejor
                await tx.misionCompletada.update({
                  where: {
                    idMision_idProgreso: {
                      idMision: mision.idMision,
                      idProgreso: idProgreso,
                    },
                  },
                  data: {
                    estrellas: mision.estrellas,
                    exp: mision.exp,
                    intentos: mision.intentos,
                    fechaCompletado: fechaMision,
                  },
                });

                totalEstrellasDelta += mision.estrellas - existing.estrellas;
                totalExpDelta += mision.exp - existing.exp;
                totalIntentosDelta += mision.intentos - existing.intentos;
              }
            } else {
              // Crear
              await tx.misionCompletada.create({
                data: {
                  idMision: mision.idMision,
                  idProgreso: idProgreso,
                  estrellas: mision.estrellas,
                  exp: mision.exp,
                  intentos: mision.intentos,
                  fechaCompletado: fechaMision,
                },
              });

              totalEstrellasDelta += mision.estrellas;
              totalExpDelta += mision.exp;
              totalIntentosDelta += mision.intentos;
              cantMisionesCompletadasDelta += 1;
            }
          }

          // --- Paso B: Procesar Misiones ESPECIALES ---
          for (const mision of misionesEspeciales) {
            const fechaMision = new Date(mision.fechaCompletado);
            if (fechaMision > ultimaActividadLote) {
              ultimaActividadLote = fechaMision;
            }

            const existing = await tx.misionEspecialCompletada.findUnique({
              where: { id: mision.idMision },
            });

            if (existing) {
              // LOGICA HIGH SCORE
              const esMejorPuntaje =
                mision.estrellas > existing.estrellas ||
                (mision.estrellas === existing.estrellas &&
                  mision.exp > existing.exp);

              if (esMejorPuntaje) {
                await tx.misionEspecialCompletada.update({
                  where: { id: mision.idMision },
                  data: {
                    nombre: mision.nombre ?? existing.nombre,
                    descripcion: mision.descripcion ?? existing.descripcion,
                    estrellas: mision.estrellas,
                    exp: mision.exp,
                    intentos: mision.intentos,
                    fechaCompletado: fechaMision,
                  },
                });

                totalEstrellasDelta += mision.estrellas - existing.estrellas;
                totalExpDelta += mision.exp - existing.exp;
                totalIntentosDelta += mision.intentos - existing.intentos;
              }
            } else {
              await tx.misionEspecialCompletada.create({
                data: {
                  id: mision.idMision,
                  idProgreso: idProgreso,
                  nombre: mision.nombre ?? 'Misión Especial Sin Nombre',
                  descripcion:
                    mision.descripcion ?? 'Sin descripción disponible',
                  estrellas: mision.estrellas,
                  exp: mision.exp,
                  intentos: mision.intentos,
                  fechaCompletado: fechaMision,
                },
              });

              totalEstrellasDelta += mision.estrellas;
              totalExpDelta += mision.exp;
              totalIntentosDelta += mision.intentos;
            }
          }

          // --- Paso C: Actualizar ProgresoAlumno ---
          const progAlumnoActualizado = await tx.progresoAlumno.update({
            where: { id: idProgreso },
            data: {
              totalEstrellas: { increment: totalEstrellasDelta },
              totalExp: { increment: totalExpDelta },
              totalIntentos: { increment: totalIntentosDelta },
              cantMisionesCompletadas: {
                increment: cantMisionesCompletadasDelta,
              },
              ultimaActividad:
                ultimaActividadLote.getTime() > 0
                  ? ultimaActividadLote
                  : undefined,
            },
          });

          // --- Paso D: Recalcular Porcentajes y Promedios ---
          let nuevoPromEstrellas = 0;
          let nuevoPromIntentos = 0;

          if (progAlumnoActualizado.cantMisionesCompletadas > 0) {
            nuevoPromEstrellas =
              progAlumnoActualizado.totalEstrellas /
              progAlumnoActualizado.cantMisionesCompletadas;

            nuevoPromIntentos =
              progAlumnoActualizado.totalIntentos /
              progAlumnoActualizado.cantMisionesCompletadas;
          }

          const nuevoPctCompletadas =
            (progAlumnoActualizado.cantMisionesCompletadas /
              TOTAL_MISIONES_JUEGO) *
            100;

          const progresoFinal = await tx.progresoAlumno.update({
            where: { id: idProgreso },
            data: {
              promEstrellas: nuevoPromEstrellas,
              promIntentos: nuevoPromIntentos,
              pctMisionesCompletadas: nuevoPctCompletadas,
            },
          });

          // Definimos la fecha de registro para el historial
          const fechaRegistroHistorial =
            ultimaActividadLote.getTime() > 0
              ? ultimaActividadLote
              : new Date();

          // --- NUEVO: Insertar en HistorialProgresoAlumno ---
          await tx.historialProgresoAlumno.create({
            data: {
              idProgreso: idProgreso,
              cantMisionesCompletadas: progresoFinal.cantMisionesCompletadas,
              totalEstrellas: progresoFinal.totalEstrellas,
              totalExp: progresoFinal.totalExp,
              totalIntentos: progresoFinal.totalIntentos,
              pctMisionesCompletadas: progresoFinal.pctMisionesCompletadas,
              promEstrellas: progresoFinal.promEstrellas,
              promIntentos: progresoFinal.promIntentos,
              fechaRegistro: fechaRegistroHistorial,
            },
          });

          // --- Paso E: Recalcular ProgresoCurso ---
          await this.recalculateCourseProgress(
            tx,
            idCurso,
            fechaRegistroHistorial,
          );

          return { message: 'Lote de progreso registrado con éxito' };
        },
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2002') {
          throw new BadRequestException(
            'Datos inválidos (ej: una Misión o Alumno no existen)',
          );
        }
      }
      console.error('Error en submitBatchMissions:', error);
      throw new InternalServerErrorException(
        'Error al registrar el lote de progreso.',
      );
    }
  }

  /**
   * Obtiene la lista de TODAS las misiones del juego,
   * fusionada con el estado (completada o pendiente) de UN alumno.
   */
  async getStudentMissionStatus(idAlumno: string, idCurso: string) {
    try {
      // 1. Buscar el idProgreso del alumno en ESE curso
      const inscripcion = await this.prisma.alumnoCurso.findUnique({
        where: {
          idAlumno_idCurso: {
            idAlumno: idAlumno,
            idCurso: idCurso,
          },
        },
        select: { idProgreso: true },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'Inscripción del alumno en este curso no encontrada.',
        );
      }
      const { idProgreso } = inscripcion;

      // 2. Buscar TODAS las misiones maestras (ej: las 10 misiones)
      const allMissions = await this.prisma.mision.findMany({
        orderBy: {
          dificultadMision: 'asc', // Opcional: ordenar Facil -> Dificil
        },
        include: {
          // 3. Incluir el registro de "misionCompletada" SÓLO
          // si coincide con el idProgreso de nuestro alumno.
          misionesCompletadas: {
            where: {
              idProgreso: idProgreso,
            },
          },
        },
      });

      // 4. Formatear la respuesta (la "fusión")
      // Formatear la respuesta de forma segura
      return allMissions.map((mision) => {
        // Desestructuramos el objeto 'mision'.
        // 'misionesCompletadas' se va a una variable...
        const { misionesCompletadas, ...restOfMision } = mision;

        // ...y 'restOfMision' contiene el resto (id, nombre, desc).

        // Obtenemos el registro (o null) de la variable que separamos
        const completada = misionesCompletadas[0] || null;

        // Devolvemos el objeto limpio y 100% type-safe
        return {
          mision: restOfMision, // Este es el objeto 'mision' SIN 'misionesCompletadas'
          completada: completada,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getStudentMissionStatus:', error);
      throw new InternalServerErrorException(
        'Error al obtener el estado de las misiones.',
      );
    }
  }

  // --- MÉTODOS HELPER PRIVADOS ---

  /**
   * Construye la cláusula WHERE para la consulta de alumnos
   */
  private buildWhereClause(
    idCurso: string,
    search?: string,
    progressRange?: ProgressRange,
    starsRange?: StarsRange,
    attemptsRange?: AttemptsRange,
    activityRange?: ActivityRange,
  ): Prisma.AlumnoCursoWhereInput {
    // Base: Siempre filtramos por curso y estado activo
    const where: Prisma.AlumnoCursoWhereInput = {
      idCurso: idCurso,
      estado: 'Activo',
    };

    // Filtro de Búsqueda (nombre/apellido)
    if (search) {
      where.alumno = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Objeto para los filtros de 'progresoAlumno'
    const progressWhere: Prisma.ProgresoAlumnoWhereInput = {};

    // Filtro de Progreso (%)
    switch (progressRange) {
      case ProgressRange.ZERO:
        progressWhere.pctMisionesCompletadas = 0;
        break;
      case ProgressRange.RANGE_1_25:
        progressWhere.pctMisionesCompletadas = { gte: 1, lte: 25 };
        break;
      case ProgressRange.RANGE_26_50:
        progressWhere.pctMisionesCompletadas = { gte: 26, lte: 50 };
        break;
      case ProgressRange.RANGE_51_75:
        progressWhere.pctMisionesCompletadas = { gte: 51, lte: 75 };
        break;
      case ProgressRange.RANGE_76_99:
        progressWhere.pctMisionesCompletadas = { gte: 76, lte: 99 };
        break;
      case ProgressRange.FULL:
        progressWhere.pctMisionesCompletadas = 100;
        break;
    }

    // Filtro de Estrellas (Promedio)
    switch (starsRange) {
      case StarsRange.LOW:
        progressWhere.promEstrellas = { gte: 0, lte: 1 };
        break;
      case StarsRange.MEDIUM:
        progressWhere.promEstrellas = { gte: 1.1, lte: 2 };
        break;
      case StarsRange.HIGH:
        progressWhere.promEstrellas = { gte: 2.1, lte: 3 };
        break;
    }

    // Filtro de Intentos (Promedio)
    switch (attemptsRange) {
      case AttemptsRange.FAST:
        progressWhere.promIntentos = { lt: 3 };
        break;
      case AttemptsRange.NORMAL:
        progressWhere.promIntentos = { gte: 3, lte: 6 };
        break;
      case AttemptsRange.MANY:
        progressWhere.promIntentos = { gte: 6, lte: 9 };
        break;
      case AttemptsRange.TOO_MANY:
        progressWhere.promIntentos = { gte: 10 };
        break;
    }

    // Filtro de Última Actividad
    if (activityRange) {
      const now = new Date();
      const dateLimit = new Date();

      switch (activityRange) {
        case ActivityRange.INACTIVE:
          dateLimit.setDate(now.getDate() - 7);
          progressWhere.ultimaActividad = { lt: dateLimit };
          break;
        case ActivityRange.LAST_24H:
          dateLimit.setDate(now.getDate() - 1);
          progressWhere.ultimaActividad = { gte: dateLimit };
          break;
        case ActivityRange.LAST_3D:
          dateLimit.setDate(now.getDate() - 3);
          progressWhere.ultimaActividad = { gte: dateLimit };
          break;
        case ActivityRange.LAST_5D:
          dateLimit.setDate(now.getDate() - 5);
          progressWhere.ultimaActividad = { gte: dateLimit };
          break;
        case ActivityRange.LAST_7D:
          dateLimit.setDate(now.getDate() - 7);
          progressWhere.ultimaActividad = { gte: dateLimit };
          break;
      }
    }

    // Si agregamos algún filtro de progreso, lo añadimos al WHERE principal
    if (Object.keys(progressWhere).length > 0) {
      where.progresoAlumno = progressWhere;
    }

    return where;
  }

  /**
   * Construye la cláusula ORDER BY
   */
  private buildOrderByClause(
    sort: string,
    order: 'asc' | 'desc',
  ): Prisma.AlumnoCursoOrderByWithRelationInput {
    // Si el 'sort' es 'nombre' o 'apellido', ordenamos por la relación 'alumno'
    if (sort === 'nombre' || sort === 'apellido') {
      return {
        alumno: {
          [sort]: order,
        },
      };
    }

    // Si no, ordenamos por la relación 'progresoAlumno'
    // (Ej: promEstrellas, pctMisionesCompletadas, ultimaActividad)
    return {
      progresoAlumno: {
        [sort]: order,
      },
    };
  }

  /**
   * Recalcula los KPIs de ProgresoCurso
   */
  public async recalculateCourseProgress(
    tx: Prisma.TransactionClient,
    idCurso: string,
    fechaRegistro: Date = new Date(),
  ) {
    // 1. Obtenemos el ID del ProgresoCurso
    const curso = await tx.curso.findUnique({
      where: { id: idCurso },
      select: { idProgreso: true },
    });
    if (!curso) return; // El curso no existe

    // 2. AGREGACIÓN 1: Para TODOS los alumnos activos
    // (Para las SUMAS totales y el PROMEDIO de PCT Completado)
    const agregadosTodos = await tx.progresoAlumno.aggregate({
      _sum: {
        cantMisionesCompletadas: true,
        totalEstrellas: true,
        totalExp: true,
        totalIntentos: true,
      },
      _avg: {
        pctMisionesCompletadas: true, // <-- KPI #1
      },
      where: {
        alumnoCurso: {
          idCurso: idCurso,
          estado: 'Activo', // Solo de alumnos activos
        },
      },
    });

    // 3. AGREGACIÓN 2: Para alumnos que SÍ JUGARON
    // (Para los PROMEDIOS de Estrellas e Intentos)
    const agregadosJugadores = await tx.progresoAlumno.aggregate({
      _avg: {
        promEstrellas: true, // <-- KPI #2
        promIntentos: true, // <-- KPI #3
      },
      where: {
        alumnoCurso: {
          idCurso: idCurso,
          estado: 'Activo',
        },
        // ¡La clave está aquí!
        ultimaActividad: {
          not: null,
        },
      },
    });

    // 4. Actualizamos la tabla ProgresoCurso combinando ambas agregaciones
    const cursoActualizado = await tx.progresoCurso.update({
      where: { id: curso.idProgreso },
      data: {
        // --- Datos de la Agregación 1 (Todos) ---
        misionesCompletadas: agregadosTodos._sum.cantMisionesCompletadas || 0,
        totalEstrellas: agregadosTodos._sum.totalEstrellas || 0,
        totalExp: agregadosTodos._sum.totalExp || 0,
        totalIntentos: agregadosTodos._sum.totalIntentos || 0,
        pctMisionesCompletadas: agregadosTodos._avg.pctMisionesCompletadas || 0,

        // --- Datos de la Agregación 2 (Solo Jugadores) ---
        promEstrellas: agregadosJugadores._avg.promEstrellas || 0,
        promIntentos: agregadosJugadores._avg.promIntentos || 0,
      },
    });

    // --- NUEVO: Insertar en HistorialProgresoCurso ---
    await tx.historialProgresoCurso.create({
      data: {
        idProgresoCurso: curso.idProgreso,
        misionesCompletadas: cursoActualizado.misionesCompletadas,
        totalEstrellas: cursoActualizado.totalEstrellas,
        totalExp: cursoActualizado.totalExp,
        totalIntentos: cursoActualizado.totalIntentos,
        pctMisionesCompletadas: cursoActualizado.pctMisionesCompletadas,
        promEstrellas: cursoActualizado.promEstrellas,
        promIntentos: cursoActualizado.promIntentos,
        fechaRegistro: fechaRegistro,
      },
    });
  }
}
