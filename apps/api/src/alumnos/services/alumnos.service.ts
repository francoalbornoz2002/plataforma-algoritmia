import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { dateToTime } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlumnosService {
  constructor(private prisma: PrismaService) {}

  async findMyCourses(idAlumno: string) {
    try {
      // Buscamos en la tabla 'AlumnoCurso' las inscripciones del alumno
      const inscripciones = await this.prisma.alumnoCurso.findMany({
        where: {
          idAlumno: idAlumno,
        },
        // Ordenamos para que el curso activo aparezca primero.
        orderBy: {
          estado: 'asc',
        },
        // Incluimos los datos del curso relacionado
        include: {
          curso: {
            // Incluimos los detalles del curso (para la Card)
            include: {
              // (Usamos el filtro de 'Activo' que ya implementamos)
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
      // Mapeamos la respuesta para aplanar la estructura
      const inscripcionesAplanadas = inscripciones.map((inscripcion) => {
        // 1. Aplanamos los docentes
        const docentesAplanados = inscripcion.curso.docentes.map(
          (dc) => dc.docente,
        );

        // 2. Formateamos las fechas de diasClase (igual que en findOne)
        const diasClaseFormateados = inscripcion.curso.diasClase.map((d) => ({
          id: d.id,
          dia: d.dia,
          modalidad: d.modalidad,
          horaInicio: dateToTime(d.horaInicio),
          horaFin: dateToTime(d.horaFin),
        }));

        // 3. Devolvemos la 'inscripcion' con el 'curso' modificado
        return {
          ...inscripcion,
          curso: {
            ...inscripcion.curso,
            docentes: docentesAplanados, // Reemplazamos docentes
            diasClase: diasClaseFormateados, // Reemplazamos diasClase
          },
        };
      });

      return inscripcionesAplanadas; // Devolvemos la lista aplanada
    } catch (error) {
      console.error('Error al buscar los cursos del alumno:', error);
      throw new InternalServerErrorException('Error al obtener tus cursos');
    }
  }
}
