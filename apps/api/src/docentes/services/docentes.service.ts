import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRespuestaDto } from 'src/consultas/dto/create-respuesta.dto';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';
import { FindStudentDifficultiesDto } from 'src/difficulties/dto/find-student-difficulties.dto';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import { dateToTime } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindStudentProgressDto } from 'src/progress/dto/find-student-progress.dto';
import { ProgressService } from 'src/progress/services/progress.service';
import { checkDocenteAccess } from 'src/helpers/access.helper';
import { estado_consulta, estado_sesion, estado_simple } from '@prisma/client';

@Injectable()
export class DocentesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private difficultiesService: DifficultiesService,
    private consultasService: ConsultasService,
  ) {}

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
                select: {
                  alumnos: {
                    where: {
                      estado: {
                        in: [estado_simple.Activo, estado_simple.Finalizado],
                      },
                    },
                  },
                },
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

  /**
   * Pide el Resumen (KPIs) del curso al ProgressService
   */
  async getCourseOverview(idCurso: string, idDocente: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.progressService.getCourseOverview(idCurso);
  }

  /**
   * Pide la lista de alumnos al ProgressService
   */
  async getStudentProgressList(
    idCurso: string,
    dto: FindStudentProgressDto,
    idDocente: string,
  ) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.progressService.getStudentProgressList(idCurso, dto);
  }

  async getCourseDifficultiesOverview(idCurso: string, idDocente: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.difficultiesService.getCourseDifficultiesOverview(idCurso);
  }

  async getStudentDifficultyList(
    idCurso: string,
    dto: FindStudentDifficultiesDto,
    idDocente: string,
  ) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.difficultiesService.getStudentDifficultyList(idCurso, dto);
  }

  async getStudentDifficultiesDetail(
    idAlumno: string,
    idCurso: string,
    idDocente: string,
  ) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.difficultiesService.getStudentDifficultiesDetail(
      idAlumno,
      idCurso,
    );
  }

  async getStudentMissions(
    idAlumno: string,
    idCurso: string,
    idDocente: string,
  ) {
    // 1. Validamos que el docente tenga acceso a este curso
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    // (Aquí podríamos validar también que el alumno pertenezca al curso si quisiéramos)

    // 2. Llamamos al servicio "cerebro"
    return this.progressService.getStudentMissionStatus(idAlumno, idCurso);
  }

  async findConsultas(
    idCurso: string,
    idDocente: string,
    dto: FindConsultasDto,
  ) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso); // 3. Validar
    return this.consultasService.findConsultasForDocente(idCurso, dto);
  }

  async createRespuesta(
    idConsulta: string,
    idDocente: string,
    dto: CreateRespuestaDto,
  ) {
    // 4.1. Buscamos la consulta para saber a qué curso pertenece
    const consulta = await this.prisma.consulta.findUnique({
      where: { id: idConsulta },
      select: { idCurso: true },
    });

    if (!consulta) {
      throw new NotFoundException('La consulta no existe.');
    }

    // 4.2. Validamos que el docente pertenezca a ESE curso
    await checkDocenteAccess(this.prisma, idDocente, consulta.idCurso);

    // 4.3. Si todo está bien, llamamos al servicio
    return this.consultasService.createRespuesta(idConsulta, idDocente, dto);
  }

  /**
   * Obtiene la lista de docentes activos de un curso (para los filtros)
   */
  async findActiveDocentesByCurso(
    idCurso: string,
    idDocenteSolicitante: string,
  ) {
    // 1. Validamos que el docente que pide tenga acceso
    await checkDocenteAccess(this.prisma, idDocenteSolicitante, idCurso);

    // 2. Buscamos los docentes activos
    const asignaciones = await this.prisma.docenteCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: 'Activo',
      },
      include: {
        docente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // 3. Mapeamos la respuesta
    return asignaciones.map((a) => a.docente);
  }

  /**
   * Da de baja a un alumno de un curso específico.
   * (Soft delete de la inscripción y cierre de pendientes)
   */
  async removeStudentFromCourse(
    idCurso: string,
    idAlumno: string,
    idDocenteSolicitante: string,
  ) {
    // 1. Validar acceso del docente
    await checkDocenteAccess(this.prisma, idDocenteSolicitante, idCurso);

    // 2. Validar que el alumno esté activo en el curso
    const inscripcion = await this.prisma.alumnoCurso.findUnique({
      where: {
        idAlumno_idCurso: {
          idAlumno,
          idCurso,
        },
      },
      include: {
        progresoAlumno: true,
      },
    });

    if (!inscripcion || inscripcion.estado !== estado_simple.Activo) {
      throw new NotFoundException(
        'El alumno no está inscripto o ya está inactivo en este curso.',
      );
    }

    // 3. Ejecutar baja en transacción
    return this.prisma.$transaction(async (tx) => {
      // a. Baja de inscripción
      await tx.alumnoCurso.update({
        where: { idAlumno_idCurso: { idAlumno, idCurso } },
        data: { estado: estado_simple.Inactivo, fechaBaja: new Date() },
      });

      // b. Baja de progreso
      await tx.progresoAlumno.update({
        where: { id: inscripcion.idProgreso },
        data: { estado: estado_simple.Inactivo },
      });

      // c. Cerrar Consultas pendientes (Pendiente, A_revisar, Revisada -> No_resuelta)
      await tx.consulta.updateMany({
        where: {
          idCurso,
          idAlumno,
          estado: {
            in: [
              estado_consulta.Pendiente,
              estado_consulta.A_revisar,
              estado_consulta.Revisada,
            ],
          },
        },
        data: { estado: estado_consulta.No_resuelta },
      });

      // d. Cerrar Sesiones pendientes (Pendiente -> No_realizada)
      await tx.sesionRefuerzo.updateMany({
        where: { idCurso, idAlumno, estado: estado_sesion.Pendiente },
        data: { estado: estado_sesion.No_realizada },
      });

      // e. Recalcular estadísticas del curso (al pasar a Inactivo, se excluyen automáticamente)
      await this.progressService.recalculateCourseProgress(tx, idCurso);
      await this.difficultiesService.recalculateCourseDifficulties(tx, idCurso);

      return { message: 'Alumno dado de baja correctamente.' };
    });
  }
}
