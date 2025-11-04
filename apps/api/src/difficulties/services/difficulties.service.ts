import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindStudentDifficultiesDto } from '../dto/find-student-difficulties.dto';
import { Prisma, roles } from '@prisma/client';

@Injectable()
export class DifficultiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene la lista de dificultades y el grado (performance) del alumno
   * para un curso específico.
   */
  async getStudentDifficulties(idAlumno: string, idCurso: string) {
    try {
      // 1. Buscamos todas las dificultades asignadas a ese alumno en ese curso
      const dificultadesAlumno = await this.prisma.dificultadAlumno.findMany({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
        // 2. Incluimos los detalles de la dificultad (nombre, tema, etc.)
        include: {
          dificultad: true,
        },
        // Opcional: ordenar por tema o nombre
        orderBy: {
          dificultad: {
            tema: 'asc',
          },
        },
      });

      // 3. Validamos si se encontró algo
      if (!dificultadesAlumno || dificultadesAlumno.length === 0) {
        // No es un error, simplemente puede no tener dificultades aún
        return [];
      }

      // 4. Mapeamos la respuesta para que sea más limpia para el frontend
      return dificultadesAlumno.map((da) => ({
        id: da.dificultad.id,
        nombre: da.dificultad.nombre,
        descripcion: da.dificultad.descripcion,
        tema: da.dificultad.tema,
        grado: da.grado, // El grado (Ninguno, Bajo, Medio, Alto) del alumno
      }));
    } catch (error) {
      console.error('Error en getStudentDifficulties:', error);
      throw new InternalServerErrorException(
        'Error al obtener tus dificultades.',
      );
    }
  }

  /**
   * MÉTODO 1: Obtener el Resumen (KPIs) del Curso
   * (Lee la tabla 'DificultadesCurso' vinculada)
   */
  async getCourseDifficultiesOverview(idCurso: string) {
    try {
      const curso = await this.prisma.curso.findUnique({
        where: { id: idCurso },
        select: {
          dificultadesCurso: {
            // Opcional: incluir el nombre de la dificultad más frecuente
            include: {
              dificultadModa: {
                select: { nombre: true },
              },
            },
          },
        },
      });

      if (!curso || !curso.dificultadesCurso) {
        throw new NotFoundException(
          'Resumen de dificultades del curso no encontrado.',
        );
      }

      const overview = curso.dificultadesCurso;

      return {
        ...overview,
        promDificultades: parseFloat(overview.promDificultades as any),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getCourseDifficultiesOverview:', error);
      throw new InternalServerErrorException(
        'Error al obtener el resumen de dificultades.',
      );
    }
  }

  /**
   * MÉTODO 2: Obtener la lista de alumnos para la DataGrid (Resumen)
   */
  async getStudentDifficultyList(
    idCurso: string,
    dto: FindStudentDifficultiesDto,
  ) {
    const { page, limit, sort, order, search, tema, dificultadId, grado } = dto;
    const skip = (page - 1) * limit;
    const take = limit;

    try {
      // 1. Construir el WHERE (Ahora para el modelo 'Usuario')
      const where: Prisma.UsuarioWhereInput = {
        rol: roles.Alumno, // Solo Alumnos
        cursosDelAlumno: {
          // Que estén en este curso Y activos
          some: {
            idCurso: idCurso,
            estado: 'Activo',
          },
        },
      };

      if (search) {
        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filtros anidados en la relación 'dificultades' del USUARIO
      if (tema || dificultadId || grado) {
        where.dificultades = {
          // <-- Esta relación SÍ existe en 'Usuario'
          some: {
            idCurso: idCurso, // Filtramos dificultades de ESTE curso
            grado: grado,
            idDificultad: dificultadId,
            dificultad: {
              tema: tema,
            },
          },
        };
      }

      // 2. Construir el ORDER BY (para 'Usuario')
      // (Mejorado para ordenar por 'totalDificultades')
      let orderBy: Prisma.UsuarioOrderByWithRelationInput;
      if (sort === 'totalDificultades') {
        orderBy = {
          dificultades: {
            _count: order,
          },
        };
      } else {
        // 'sort' por defecto es 'nombre' o 'apellido'
        orderBy = {
          [sort]: order,
        };
      }

      // 3. Ejecutar transacciones (consultando 'usuario')
      const [alumnos, total] = await this.prisma.$transaction([
        this.prisma.usuario.findMany({
          // <-- Consultamos 'usuario'
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dificultades: {
              where: { idCurso: idCurso },
              select: { grado: true },
            },
          },
        }),
        this.prisma.usuario.count({ where }), // <-- Contamos 'usuario'
      ]);

      // 4. Mapear la respuesta Y CALCULAR LOS CONTEOS
      const data = alumnos.map((alumno) => {
        // Contamos los grados manualmente
        const alto = alumno.dificultades.filter(
          (d) => d.grado === 'Alto',
        ).length;
        const medio = alumno.dificultades.filter(
          (d) => d.grado === 'Medio',
        ).length;
        const bajo = alumno.dificultades.filter(
          (d) => d.grado === 'Bajo',
        ).length;
        const ninguno = alumno.dificultades.filter(
          (d) => d.grado === 'Ninguno',
        ).length;

        return {
          id: alumno.id,
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          totalDificultades: alumno.dificultades.length,
          gradoAlto: alto,
          gradoMedio: medio,
          gradoBajo: bajo,
          gradoNinguno: ninguno,
        };
      });

      const totalPages = Math.ceil(total / limit);
      return { data, total, page, totalPages };
    } catch (error) {
      console.error('Error en getStudentDifficultyList:', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de alumnos.',
      );
    }
  }

  /**
   * MÉTODO 3: Obtener el detalle de dificultades de UN alumno
   * (El que usamos para el Alumno, ahora reutilizado para el Modal del Docente)
   */
  async getStudentDifficultiesDetail(idAlumno: string, idCurso: string) {
    try {
      const dificultadesAlumno = await this.prisma.dificultadAlumno.findMany({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
        include: {
          dificultad: true,
        },
        orderBy: {
          dificultad: {
            tema: 'asc',
          },
        },
      });

      if (!dificultadesAlumno) {
        throw new NotFoundException(
          'No se encontraron dificultades para este alumno.',
        );
      }

      // Mapeamos para el frontend
      return dificultadesAlumno.map((da) => ({
        id: da.dificultad.id,
        nombre: da.dificultad.nombre,
        descripcion: da.dificultad.descripcion,
        tema: da.dificultad.tema,
        grado: da.grado,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getStudentDifficultiesDetail:', error);
      throw new InternalServerErrorException(
        'Error al obtener las dificultades del alumno.',
      );
    }
  }
}
