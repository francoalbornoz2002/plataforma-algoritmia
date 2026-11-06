import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressService } from 'src/progress/services/progress.service';
import { JoinCourseDto } from '../../courses/dto/join-course-dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { CreateConsultaDto } from 'src/consultas/dto/create-consulta.dto';
import { ValorarConsultaDto } from 'src/consultas/dto/valorar-consulta.dto';
import { UpdateConsultaDto } from 'src/consultas/dto/update-consulta.dto';
import { estado_simple } from '@prisma/client';
import { checkDocenteAccess } from 'src/helpers/access.helper';

@Injectable()
export class AlumnosService {
  constructor(
    private prisma: PrismaService,
    private consultasService: ConsultasService,
  ) {}

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
    const inscripciones = await this.prisma.inscripcionesAlumnoCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_simple.Activo,
      },
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            fotoPerfilUrl: true,
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

    // 2. Buscamos las inscripciones activas del curso que tengan dificultades registradas no superadas
    const inscripcionesConDificultades =
      await this.prisma.inscripcionesAlumnoCurso.findMany({
        where: {
          idCurso: idCurso,
          estado: estado_simple.Activo,
          dificultadesAlumnos: {
            some: {
              gradoActual: { not: 'Ninguno' },
            },
          },
        },
        include: {
          alumno: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              fotoPerfilUrl: true,
            },
          },
          dificultadesAlumnos: {
            where: {
              gradoActual: { not: 'Ninguno' },
            },
            select: {
              gradoActual: true,
            },
          },
        },
        orderBy: [
          { alumno: { apellido: 'asc' } },
          { alumno: { nombre: 'asc' } },
        ],
      });

    return inscripcionesConDificultades.map((inscripcion) => {
      const { alumno, dificultadesAlumnos } = inscripcion;
      const alto = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Alto',
      ).length;
      const medio = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Medio',
      ).length;
      const bajo = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Bajo',
      ).length;

      return {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        fotoPerfilUrl: alumno.fotoPerfilUrl,
        totalDificultades: dificultadesAlumnos.length,
        gradoAlto: alto,
        gradoMedio: medio,
        gradoBajo: bajo,
      };
    });
  }
}
