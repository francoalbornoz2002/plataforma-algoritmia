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
            progresoAlumno: true, // Incluimos todos los datos de progreso
          },
        }),
        // Consulta para obtener el conteo total
        this.prisma.alumnoCurso.count({ where }),
      ]);

      // 4. Mapear la respuesta para el DataGrid
      // Mapear la respuesta y convertir los Decimal a Number
      const data = alumnos.map((ac) => ({
        ...ac.progresoAlumno,
        // Convertimos los campos Decimal
        pctMisionesCompletadas: parseFloat(
          ac.progresoAlumno.pctMisionesCompletadas as any,
        ),
        promEstrellas: parseFloat(ac.progresoAlumno.promEstrellas as any),
        promIntentos: parseFloat(ac.progresoAlumno.promIntentos as any),
        // Añadimos los campos del alumno
        nombre: ac.alumno.nombre,
        apellido: ac.alumno.apellido,
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
        // 2. Incluimos el progreso de esa inscripción
        include: {
          progresoAlumno: true,
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
  async submitMission(dto: SubmitMissionDto) {
    const { idAlumno, idMision, estrellas, exp, intentos, fechaCompletado } =
      dto;

    try {
      // 1. Validar que el alumno esté activo en un curso
      const inscripcion = await this.prisma.alumnoCurso.findFirst({
        where: {
          idAlumno: idAlumno,
          estado: 'Activo',
        },
        select: {
          idCurso: true,
          idProgreso: true, // El ID del ProgresoAlumno
        },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'No se encontró una inscripción activa para este alumno.',
        );
      }

      const { idProgreso, idCurso } = inscripcion;

      // 2. Ejecutar todo como una transacción (como discutimos)
      return await this.prisma.$transaction(async (tx) => {
        // --- Paso A: Registrar la misión ---
        await tx.misionCompletada.create({
          data: {
            idMision: idMision,
            idProgreso: idProgreso, // ID de ProgresoAlumno
            estrellas: estrellas,
            exp: exp,
            intentos: intentos,
            fechaCompletado: new Date(fechaCompletado),
          },
        });

        // --- Paso B: Actualizar ProgresoAlumno (Atómicamente) ---
        const progAlumnoActualizado = await tx.progresoAlumno.update({
          where: { id: idProgreso },
          data: {
            // Operaciones atómicas para evitar 'race conditions'
            totalEstrellas: { increment: estrellas },
            totalExp: { increment: exp },
            totalIntentos: { increment: intentos },
            cantMisionesCompletadas: { increment: 1 },
            ultimaActividad: new Date(), // TODO: Que la nueva ultima actividad sea la fecha de la ultima misión completada registrada
          },
        });

        // --- Paso C: Recalcular Promedios (Alumno) ---
        // (Esto es seguro porque ocurre DENTRO de la transacción)
        const nuevoPromEstrellas =
          progAlumnoActualizado.totalEstrellas /
          progAlumnoActualizado.cantMisionesCompletadas;
        const nuevoPromIntentos =
          progAlumnoActualizado.totalIntentos /
          progAlumnoActualizado.cantMisionesCompletadas;
        const nuevoPctCompletadas =
          (progAlumnoActualizado.cantMisionesCompletadas /
            TOTAL_MISIONES_JUEGO) *
          100;

        await tx.progresoAlumno.update({
          where: { id: idProgreso },
          data: {
            promEstrellas: nuevoPromEstrellas,
            promIntentos: nuevoPromIntentos,
            pctMisionesCompletadas: nuevoPctCompletadas,
          },
        });

        // --- Paso D: Recalcular ProgresoCurso (Agregación) ---
        // Llamamos al helper para que actualice los KPIs del curso
        await this.recalculateCourseProgress(tx, idCurso);

        return { message: 'Progreso registrado con éxito' };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Error de constraint (ej: idMision no existe)
        if (error.code === 'P2003' || error.code === 'P2002') {
          throw new BadRequestException(
            'Datos inválidos (ej: Misión o Alumno no existen)',
          );
        }
      }
      console.error('Error en submitMission:', error);
      throw new InternalServerErrorException('Error al registrar el progreso.');
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
  private async recalculateCourseProgress(
    tx: Prisma.TransactionClient,
    idCurso: string,
  ) {
    // 1. Obtenemos el ID del ProgresoCurso
    const curso = await tx.curso.findUnique({
      where: { id: idCurso },
      select: { idProgreso: true },
    });
    if (!curso) return; // El curso no existe

    // 2. Hacemos una agregación de TODOS los progresos de alumnos
    // que pertenecen a este curso
    const agregados = await tx.progresoAlumno.aggregate({
      _sum: {
        cantMisionesCompletadas: true,
        totalEstrellas: true,
        totalExp: true,
        totalIntentos: true,
      },
      _avg: {
        pctMisionesCompletadas: true,
        promEstrellas: true,
        promIntentos: true,
      },
      where: {
        alumnoCurso: {
          idCurso: idCurso,
          estado: 'Activo', // Solo de alumnos activos
        },
      },
    });

    // 3. Actualizamos la tabla ProgresoCurso
    await tx.progresoCurso.update({
      where: { id: curso.idProgreso },
      data: {
        misionesCompletadas: agregados._sum.cantMisionesCompletadas || 0,
        totalEstrellas: agregados._sum.totalEstrellas || 0,
        totalExp: agregados._sum.totalExp || 0,
        totalIntentos: agregados._sum.totalIntentos || 0,
        pctMisionesCompletadas: agregados._avg.pctMisionesCompletadas || 0,
        promEstrellas: agregados._avg.promEstrellas || 0,
        promIntentos: agregados._avg.promIntentos || 0,
      },
    });
  }
}
