import {
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
}
