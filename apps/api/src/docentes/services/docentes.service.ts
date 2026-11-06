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
