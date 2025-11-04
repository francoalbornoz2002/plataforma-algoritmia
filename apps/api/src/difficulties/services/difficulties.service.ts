import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
