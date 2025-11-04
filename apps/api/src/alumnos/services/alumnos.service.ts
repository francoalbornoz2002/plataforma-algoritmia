import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import { dateToTime } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressService } from 'src/progress/services/progress.service';

@Injectable()
export class AlumnosService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private difficultiesService: DifficultiesService,
  ) {}

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

  async findMyProgress(idAlumno: string, idCurso: string) {
    // 3. Llamamos al servicio experto
    // La validación de si el alumno existe en el curso
    // ya la hace 'getStudentProgress'
    return this.progressService.getStudentProgress(idAlumno, idCurso);
  }

  async findMyDifficulties(idAlumno: string, idCurso: string) {
    // 3. Llamamos al servicio experto
    return this.difficultiesService.getStudentDifficulties(idAlumno, idCurso);
  }
}
