import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { estado_simple, Prisma } from '@prisma/client';
import { SubmitMissionDto } from '../dto/submit-mission.dto';
import { checkDocenteAccess } from 'src/helpers/access.helper';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper para convertir valores Decimal de Prisma a Number de forma segura.
   */
  private toNum(value: any): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : parseFloat(value.toString());
  }

  /**
   * MÉTODO 1: Obtener el Resumen (KPIs) del Curso
   */
  async getCourseProgressOverview(idDocente: string, idCurso: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    try {
      const progreso = await this.prisma.progresoCurso.findFirst({
        where: { idCurso },
        orderBy: { fechaRegistro: 'desc' },
      });

      if (!progreso) {
        throw new NotFoundException('Progreso del curso no encontrado.');
      }

      // 1. Misión más difícil (Mayor promedio de intentos GLOBAL)
      const topMissionGroup = await this.prisma.misionCompletada.groupBy({
        by: ['idMision'],
        where: {
          inscripcionAlumno: { idCurso },
        },
        _avg: { intentos: true },
        orderBy: { _avg: { intentos: 'desc' } },
        take: 1,
      });
      let misionMasDificil;
      if (topMissionGroup.length > 0) {
        misionMasDificil = await this.prisma.mision.findUnique({
          where: { id: topMissionGroup[0].idMision },
        });
      }

      // 2. Alumno más activo (Más misiones completadas GLOBAL)
      const topStudentGroup = await this.prisma.misionCompletada.groupBy({
        by: ['idInscripcion'],
        where: {
          inscripcionAlumno: { idCurso },
        },
        _count: { idMision: true },
        orderBy: { _count: { idMision: 'desc' } },
        take: 1,
      });
      let alumnoMasActivo: string | undefined;
      if (topStudentGroup.length > 0) {
        const inscripcion =
          await this.prisma.inscripcionesAlumnoCurso.findUnique({
            where: { id: topStudentGroup[0].idInscripcion },
            include: { alumno: true },
          });
        if (inscripcion?.alumno) {
          alumnoMasActivo = `${inscripcion.alumno.nombre} ${inscripcion.alumno.apellido}`;
        }
      }

      // Convertimos los campos Decimal (que llegan como string) a Number (float)
      return {
        ...progreso,
        pctMisionesCompletadas: this.toNum(progreso.pctMisionesCompletadas),
        promEstrellas: this.toNum(progreso.promEstrellas),
        promIntentos: this.toNum(progreso.promIntentos),
        misionMasDificil,
        alumnoMasActivo,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getCourseProgressOverview:', error);
      throw new InternalServerErrorException(
        'Error al obtener el resumen del curso.',
      );
    }
  }

  /**
   * MÉTODO 2: Obtener la lista de alumnos para la DataGrid
   */
  async getStudentProgressList(idCurso: string, idDocente: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
      select: { deletedAt: true },
    });
    const includeInactive = !!curso?.deletedAt;

    try {
      const where: Prisma.InscripcionesAlumnoCursoWhereInput = {
        idCurso: idCurso,
      };

      if (!includeInactive) {
        where.estado = estado_simple.Activo;
      } else {
        where.estado = { in: [estado_simple.Activo, estado_simple.Finalizado] };
      }

      const inscripciones = await this.prisma.inscripcionesAlumnoCurso.findMany(
        {
          where,
          include: {
            alumno: {
              select: {
                nombre: true,
                apellido: true,
                fotoPerfilUrl: true,
                dni: true,
              },
            },
            progresoAlumnos: {
              orderBy: { fechaRegistro: 'desc' },
              take: 1,
            },
            misionesEspeciales: {
              orderBy: { fechaCompletado: 'desc' },
            },
            misionesCompletadas: {
              include: { mision: true },
              orderBy: { fechaCompletado: 'desc' },
            },
          },
        },
      );

      // Mapear la respuesta para el DataGrid
      const data = inscripciones.map((ac) => {
        const progreso = ac.progresoAlumnos[0];
        return {
          ...progreso,
          id: progreso?.id,
          idInscripcion: ac.id,
          idAlumno: ac.idAlumno,
          nombre: ac.alumno.nombre,
          apellido: ac.alumno.apellido,
          fotoPerfilUrl: ac.alumno.fotoPerfilUrl,
          dni: ac.alumno.dni,
          fechaInscripcion: ac.fechaInscripcion,
          pctMisionesCompletadas: this.toNum(progreso?.pctMisionesCompletadas),
          promEstrellas: this.toNum(progreso?.promEstrellas),
          promIntentos: this.toNum(progreso?.promIntentos),
          misionesEspeciales: ac.misionesEspeciales,
          misionesCompletadas: ac.misionesCompletadas,
        };
      });

      return data;
    } catch (error) {
      console.error('Error en getStudentProgressList:', error);
      throw new InternalServerErrorException(
        'Error al obtener el progreso de los alumnos.',
      );
    }
  }

  /**
   * MÉTODO 3: Obtener el progreso de un alumno específico
   */
  async getStudentProgress(idAlumno: string, idCurso: string) {
    try {
      // 1. Buscamos la inscripción específica
      const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
        include: {
          alumno: { select: { fotoPerfilUrl: true } },
          progresoAlumnos: {
            orderBy: { fechaRegistro: 'desc' },
            take: 1,
          },
          misionesEspeciales: {
            orderBy: { fechaCompletado: 'desc' },
          },
          misionesCompletadas: {
            include: { mision: true },
            orderBy: { fechaCompletado: 'desc' },
          },
        },
      });

      const progreso = inscripcion?.progresoAlumnos?.[0];

      // 2. Validamos que exista
      if (!inscripcion || !progreso) {
        throw new NotFoundException(
          'No se encontró tu progreso para este curso.',
        );
      }

      // 3. Devolvemos el objeto de progreso con sus misiones
      return {
        ...progreso,
        misionesEspeciales: inscripcion.misionesEspeciales,
        misionesCompletadas: inscripcion.misionesCompletadas,
        fotoPerfilUrl: inscripcion.alumno.fotoPerfilUrl,
        pctMisionesCompletadas: this.toNum(progreso.pctMisionesCompletadas),
        promEstrellas: this.toNum(progreso.promEstrellas),
        promIntentos: this.toNum(progreso.promIntentos),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getStudentProgress:', error);
      throw new InternalServerErrorException('Error al obtener tu progreso.');
    }
  }

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
      // 3. Validar al alumno y obtener su inscripción activa
      const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
        where: { idAlumno: idAlumno, estado: estado_simple.Activo },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'No se encontró una inscripción activa para este alumno.',
        );
      }

      const idInscripcion = inscripcion.id;
      const idCurso = inscripcion.idCurso;

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

          // --- Paso A: Procesar Misiones NORMALES (Upsert manual) ---
          for (const mision of misionesNormales) {
            const fechaMision = new Date(mision.fechaCompletado);

            const existing = await tx.misionCompletada.findFirst({
              where: {
                idMision: mision.idMision,
                idInscripcion: idInscripcion,
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
                  where: { id: existing.id },
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
                  idInscripcion: idInscripcion,
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

            await tx.misionEspecialCompletada.create({
              data: {
                id: mision.idMision,
                idInscripcion: idInscripcion,
                nombre: mision.nombre ?? 'Misión Especial Sin Nombre',
                descripcion: mision.descripcion ?? 'Sin descripción disponible',
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

          // --- Paso C: Registrar nuevo estado en ProgresoAlumno (Historial acumulado, nunca update) ---
          const progAlumnoActual = await tx.progresoAlumno.findFirst({
            where: { idInscripcion },
            orderBy: { fechaRegistro: 'desc' },
          });

          const totalEstrellas =
            (progAlumnoActual?.totalEstrellas || 0) + totalEstrellasDelta;
          const totalExp = (progAlumnoActual?.totalExp || 0) + totalExpDelta;
          const totalIntentos =
            (progAlumnoActual?.totalIntentos || 0) + totalIntentosDelta;
          const cantMisionesCompletadas =
            (progAlumnoActual?.cantMisionesCompletadas || 0) +
            cantMisionesCompletadasDelta;

          // --- Paso D: Recalcular Porcentajes y Promedios ---
          let nuevoPromEstrellas = 0;
          let nuevoPromIntentos = 0;

          if (cantMisionesCompletadas > 0) {
            nuevoPromEstrellas = totalEstrellas / cantMisionesCompletadas;
            nuevoPromIntentos = totalIntentos / cantMisionesCompletadas;
          }

          const totalMisiones = await tx.mision.count();

          const nuevoPctCompletadas =
            totalMisiones > 0
              ? (cantMisionesCompletadas / totalMisiones) * 100
              : 0;

          const fechaRegistroSnapshot = new Date();

          // Se crea un nuevo registro con el estado actualizado (comportamiento de historial)
          await tx.progresoAlumno.create({
            data: {
              idInscripcion,
              cantMisionesCompletadas,
              totalEstrellas,
              totalExp,
              totalIntentos,
              pctMisionesCompletadas: nuevoPctCompletadas,
              promEstrellas: nuevoPromEstrellas,
              promIntentos: nuevoPromIntentos,
              fechaRegistro: fechaRegistroSnapshot,
            },
          });

          // --- Paso E: Recalcular ProgresoCurso (crea snapshot en progresoCurso) ---
          await this.recalculateCourseProgress(
            tx,
            idCurso,
            fechaRegistroSnapshot,
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
      // 1. Buscar la inscripción del alumno en ESE curso
      const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'Inscripción del alumno en este curso no encontrada.',
        );
      }
      const idInscripcion = inscripcion.id;

      // 2. Buscar TODAS las misiones maestras (ej: las 10 misiones)
      const allMissions = await this.prisma.mision.findMany({
        orderBy: {
          numero: 'asc',
        },
        include: {
          misionesCompletadas: {
            where: {
              idInscripcion: idInscripcion,
            },
          },
        },
      });

      // 3. Formatear la respuesta (la "fusión")
      return allMissions.map((mision) => {
        const { misionesCompletadas, ...restOfMision } = mision;
        const completada = misionesCompletadas[0] || null;

        return {
          mision: restOfMision,
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

  /**
   * Recalcula los KPIs de ProgresoCurso y guarda un snapshot
   */
  public async recalculateCourseProgress(
    tx: Prisma.TransactionClient,
    idCurso: string,
    fechaRegistro: Date = new Date(),
  ) {
    // 1. Condición de inscripción para el curso (Activo o Finalizado)
    const whereInscripcion = {
      idCurso: idCurso,
      estado: { in: [estado_simple.Activo, estado_simple.Finalizado] },
    };

    // 2. Traer las inscripciones con el último snapshot de cada alumno
    const [inscripciones, totalMisiones] = await Promise.all([
      tx.inscripcionesAlumnoCurso.findMany({
        where: whereInscripcion,
        select: {
          id: true,
          progresoAlumnos: {
            orderBy: { fechaRegistro: 'desc' },
            take: 1,
          },
        },
      }),
      tx.mision.count(),
    ]);

    let sumMisionesCompletadas = 0;
    let sumTotalEstrellas = 0;
    let sumTotalExp = 0;
    let sumTotalIntentos = 0;
    let sumPromEstrellas = 0;
    let sumPromIntentos = 0;
    let cantJugadores = 0;

    for (const insc of inscripciones) {
      const p = insc.progresoAlumnos[0];
      if (p) {
        sumMisionesCompletadas += p.cantMisionesCompletadas;
        sumTotalEstrellas += p.totalEstrellas;
        sumTotalExp += p.totalExp;
        sumTotalIntentos += p.totalIntentos;

        if (p.totalIntentos > 0 || p.cantMisionesCompletadas > 0) {
          sumPromEstrellas += this.toNum(p.promEstrellas);
          sumPromIntentos += this.toNum(p.promIntentos);
          cantJugadores++;
        }
      }
    }

    const totalAlumnos = inscripciones.length;

    const pctMisionesCompletadas =
      totalAlumnos > 0 && totalMisiones > 0
        ? (sumMisionesCompletadas / (totalAlumnos * totalMisiones)) * 100
        : 0;

    const promEstrellas =
      cantJugadores > 0 ? sumPromEstrellas / cantJugadores : 0;
    const promIntentos =
      cantJugadores > 0 ? sumPromIntentos / cantJugadores : 0;

    // 3. Crear nuevo registro histórico / snapshot en ProgresoCurso
    await tx.progresoCurso.create({
      data: {
        idCurso: idCurso,
        misionesCompletadas: sumMisionesCompletadas,
        totalEstrellas: sumTotalEstrellas,
        totalExp: sumTotalExp,
        totalIntentos: sumTotalIntentos,
        pctMisionesCompletadas: pctMisionesCompletadas,
        promEstrellas: promEstrellas,
        promIntentos: promIntentos,
        fechaRegistro: fechaRegistro,
      },
    });
  }
}
