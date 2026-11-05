import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRespuestaDto } from 'src/consultas/dto/create-respuesta.dto';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressService } from 'src/progress/services/progress.service';
import {
  checkAlumnoAccess,
  checkDocenteAccess,
} from 'src/helpers/access.helper';
import {
  estado_consulta,
  estado_sesion,
  estado_simple,
  Prisma,
  PrismaClient,
  roles,
} from '@prisma/client';

@Injectable()
export class DocentesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private difficultiesService: DifficultiesService,
    private consultasService: ConsultasService,
  ) {}

  async getCourseDifficultiesOverview(idCurso: string, idDocente: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.difficultiesService.getCourseDifficultiesOverview(idCurso);
  }

  async getStudentDifficultyList(idCurso: string, idDocente: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    return this.difficultiesService.getStudentDifficultyList(idCurso);
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
    idUsuarioSolicitante: string,
    rol: roles,
  ) {
    // 1. Validamos acceso según el rol del solicitante
    if (rol === roles.Alumno) {
      await checkAlumnoAccess(this.prisma, idUsuarioSolicitante, idCurso);
    } else {
      await checkDocenteAccess(this.prisma, idUsuarioSolicitante, idCurso);
    }

    // 2. Buscamos los docentes activos
    const asignaciones = await this.prisma.asignacionesDocenteCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_simple.Activo,
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
    const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
      where: {
        idAlumno: idAlumno,
        idCurso: idCurso,
      },
    });

    if (!inscripcion || inscripcion.estado !== estado_simple.Activo) {
      throw new NotFoundException(
        'El alumno no está inscripto o ya está inactivo en este curso.',
      );
    }

    // 3. Ejecutar baja en transacción
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Baja de inscripción
      await tx.inscripcionesAlumnoCurso.update({
        where: { id: inscripcion.id },
        data: { estado: estado_simple.Inactivo, fechaBaja: new Date() },
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
