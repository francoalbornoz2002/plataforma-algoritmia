import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import { dateToTime } from 'src/helpers';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressService } from 'src/progress/services/progress.service';
import { JoinCourseDto } from '../dto/join-course-dto';

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

  async joinCourse(user: UserPayload, joinCourseDto: JoinCourseDto) {
    // 1. Desempacamos los datos
    const { userId: idAlumno } = user; // (O 'id', según tu payload)
    const { idCurso, contrasenaAcceso } = joinCourseDto;

    // 2. (El Rol 'Alumno' ya está validado por el RolesGuard en el controlador)

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 3. Validar Curso y Contraseña
        const curso = await tx.curso.findUnique({
          where: { id: idCurso, deletedAt: null },
        });

        if (!curso) {
          throw new NotFoundException(
            'Curso no encontrado o no está disponible.',
          );
        }

        if (curso.contrasenaAcceso !== contrasenaAcceso) {
          throw new BadRequestException(
            'La contraseña del curso es incorrecta.',
          );
        }

        // 4. Validar que el alumno no tenga OTRA inscripción activa
        const otraInscripcionActiva = await tx.alumnoCurso.findFirst({
          where: {
            idAlumno: idAlumno,
            estado: 'Activo',
            NOT: { idCurso: idCurso },
          },
        });

        if (otraInscripcionActiva) {
          throw new BadRequestException(
            'Ya tienes una inscripción activa en otro curso.',
          );
        }

        // 5. Buscar inscripción existente (para reactivar)
        const inscripcionExistente = await tx.alumnoCurso.findUnique({
          where: {
            idAlumno_idCurso: {
              idAlumno: idAlumno,
              idCurso: idCurso,
            },
          },
        });

        if (inscripcionExistente) {
          // El alumno ya estuvo en este curso
          if (inscripcionExistente.estado === 'Activo') {
            throw new BadRequestException('Ya estás inscripto en este curso.');
          }
          // Reactivación
          await tx.progresoAlumno.update({
            where: { id: inscripcionExistente.idProgreso },
            data: { estado: 'Activo' },
          });
          return tx.alumnoCurso.update({
            where: { idAlumno_idCurso: { idAlumno, idCurso } },
            data: { estado: 'Activo' },
          });
        } else {
          // --- Inscripción Nueva ---

          // Inicializamos el progreso del alumno (tabla ProgresoAlumno)
          const nuevoProgreso = await tx.progresoAlumno.create({
            data: {
              // Los campos utilizan @default de prisma.
            },
          });

          // Creamos la Inscripción (tabla AlumnoCurso)
          return tx.alumnoCurso.create({
            data: {
              idAlumno: idAlumno,
              idCurso: idCurso,
              idProgreso: nuevoProgreso.id,
              estado: 'Activo',
            },
          });
        }
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo completar la inscripción.',
      );
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
