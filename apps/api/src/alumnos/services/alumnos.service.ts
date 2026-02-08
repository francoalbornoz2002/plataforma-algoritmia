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
import { ConsultasService } from 'src/consultas/services/consultas.service';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { CreateConsultaDto } from 'src/consultas/dto/create-consulta.dto';
import { ValorarConsultaDto } from 'src/consultas/dto/valorar-consulta.dto';
import { UpdateConsultaDto } from 'src/consultas/dto/update-consulta.dto';
import { roles } from '@prisma/client';
import { checkDocenteAccess } from 'src/helpers/access.helper';

@Injectable()
export class AlumnosService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private difficultiesService: DifficultiesService,
    private consultasService: ConsultasService,
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

          // Inicializamos el historial del alumno
          await tx.historialProgresoAlumno.create({
            data: {
              idProgreso: nuevoProgreso.id,
              cantMisionesCompletadas: 0,
              totalEstrellas: 0,
              totalExp: 0,
              totalIntentos: 0,
              pctMisionesCompletadas: 0,
              promEstrellas: 0,
              promIntentos: 0,
              fechaRegistro: new Date(),
            },
          });

          // Creamos la Inscripción (tabla AlumnoCurso)
          const inscripcion = await tx.alumnoCurso.create({
            data: {
              idAlumno: idAlumno,
              idCurso: idCurso,
              idProgreso: nuevoProgreso.id,
              estado: 'Activo',
            },
          });

          // Actualizamos el progreso general del curso (para incluir al nuevo alumno en los promedios)
          await this.progressService.recalculateCourseProgress(tx, idCurso);

          return inscripcion;
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

  async findMyMissions(idAlumno: string, idCurso: string) {
    return this.progressService.getStudentMissionStatus(idAlumno, idCurso);
  }

  async findMyConsultas(
    idAlumno: string,
    idCurso: string,
    dto: FindConsultasDto,
  ) {
    return this.consultasService.findConsultasForAlumno(idAlumno, idCurso, dto);
  }

  async createConsulta(
    idAlumno: string,
    idCurso: string,
    dto: CreateConsultaDto,
  ) {
    // El servicio "cerebro" hace todo el trabajo
    return this.consultasService.createConsulta(idAlumno, idCurso, dto);
  }

  async updateConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: UpdateConsultaDto,
  ) {
    return this.consultasService.updateConsulta(idConsulta, idAlumno, dto);
  }

  async deleteConsulta(idConsulta: string, idAlumno: string) {
    return this.consultasService.deleteConsulta(idConsulta, idAlumno);
  }

  async valorarConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: ValorarConsultaDto,
  ) {
    // El servicio "cerebro" hace todo el trabajo
    return this.consultasService.valorarConsulta(idConsulta, idAlumno, dto);
  }

  async findActiveAlumnosByCurso(idCurso: string, idDocente: string) {
    // 1. Validamos que el docente que pide tenga acceso
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    // 2. Buscamos los alumnos activos
    const inscripciones = await this.prisma.alumnoCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: 'Activo',
      },
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // 3. Mapeamos la respuesta
    return inscripciones.map((i) => i.alumno);
  }

  async findEligibleForRefuerzo(idCurso: string, idDocente: string) {
    // 1. Validamos que el docente que pide tenga acceso
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    // 2. Buscamos los alumnos que están activos en el curso y tienen al menos una dificultad registrada para ese curso.
    const alumnosElegibles = await this.prisma.usuario.findMany({
      where: {
        rol: roles.Alumno,
        // Filtro para asegurar que el alumno esté activo en el curso
        cursosDelAlumno: {
          some: {
            idCurso: idCurso,
            estado: 'Activo',
          },
        },
        // Filtro para asegurar que el alumno tenga al menos una dificultad en ese curso
        dificultades: {
          some: {
            idCurso: idCurso,
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return alumnosElegibles;
  }
}
