import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { dateToTime } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocentesService {
  constructor(private prisma: PrismaService) {}
  /**
   * Busca TODOS los cursos (activos e inactivos) asignados a un docente.
   * Ordena por estado para que los 'Activo' aparezcan primero.
   */
  async findMyCourses(idDocente: string) {
    try {
      // Buscamos en 'DocenteCurso'
      const asignaciones = await this.prisma.docenteCurso.findMany({
        where: {
          idDocente: idDocente,
          // Sin filtrar por estado, para traer activos e inactivos
        },
        // Ordenamos para que el activo aparezca primero
        orderBy: {
          estado: 'asc',
        },
        // Incluimos los datos del curso relacionado
        include: {
          curso: {
            // Incluimos los mismos detalles que en 'findAll' de cursos
            include: {
              docentes: {
                where: { estado: 'Activo' },
                select: {
                  docente: {
                    select: { id: true, nombre: true, apellido: true },
                  },
                },
              },
              _count: {
                select: { alumnos: true },
              },
              diasClase: true,
            },
          },
        },
      });

      const asignacionesAplanadas = asignaciones.map((asignacion) => {
        const docentesAplanados = asignacion.curso.docentes.map(
          (dc) => dc.docente,
        );
        const diasClaseFormateados = asignacion.curso.diasClase.map((d) => ({
          id: d.id,
          dia: d.dia,
          modalidad: d.modalidad,
          horaInicio: dateToTime(d.horaInicio),
          horaFin: dateToTime(d.horaFin),
        }));

        return {
          ...asignacion,
          curso: {
            ...asignacion.curso,
            docentes: docentesAplanados,
            diasClase: diasClaseFormateados,
          },
        };
      });

      return asignacionesAplanadas;
    } catch (error) {
      console.error('Error al buscar los cursos del docente:', error);
      throw new InternalServerErrorException('Error al obtener tus cursos');
    }
  }
}
