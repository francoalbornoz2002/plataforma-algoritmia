import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { SubmitDifficultyDto } from '../dto/submit-difficulty.dto';
import { DifficultiesService } from '../services/difficulties.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { estado_simple, roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@UseGuards(RolesGuard)
@Controller('dificultades')
export class DifficultiesController {
  constructor(
    private readonly difficultiesService: DifficultiesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint para obtener la lista de dificultades para filtros.
   */
  @Get()
  findAllForFilter() {
    return this.difficultiesService.findAllForFilter();
  }

  /**
   * Endpoint para que el videojuego registre/actualice una o varias dificultades.
   * TODO: Proteger esto con un Guardia de API Key.
   */
  @Public()
  @Post('registrar')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: [SubmitDifficultyDto] })
  async submitBatchDifficulties(@Body() dtos: SubmitDifficultyDto[]) {
    return this.difficultiesService.submitDifficulties(dtos);
  }
  @Public()
  @Get(':idAlumno/sincronizar')
  async syncDifficulties(@Param('idAlumno', ParseUUIDPipe) idAlumno: string) {
    // 1. Buscamos si el alumno tiene una inscripción activa
    const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
      where: {
        idAlumno: idAlumno,
        estado: estado_simple.Activo,
      },
      select: { idCurso: true },
    });

    if (!inscripcion) {
      return []; // No hay curso activo, devolvemos lista vacía
    }

    // 2. Reutilizamos el servicio de dificultades existente
    return this.difficultiesService.getStudentDifficulties(
      idAlumno,
      inscripcion.idCurso,
    );
  }

  @Roles(roles.Docente)
  @Get(':idCurso/resumen')
  getCourseDifficultiesOverview(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idDocente = req.user.userId;
    return this.difficultiesService.getCourseDifficultiesOverview(
      idDocente,
      idCurso,
    );
  }

  @Roles(roles.Docente)
  @Get(':idCurso/alumnos')
  getStudentDifficultyList(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idDocente = req.user.userId;
    return this.difficultiesService.getStudentDifficultyList(
      idDocente,
      idCurso,
    );
  }

  @Roles(roles.Alumno)
  @Get(':idCurso/mis-dificultades')
  findMyDifficulties(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    return this.difficultiesService.getStudentDifficulties(
      req.user.userId,
      idCurso,
    );
  }

  @Roles(roles.Docente)
  @Get(':idCurso/:idAlumno')
  findStudentDifficulties(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
  ) {
    return this.difficultiesService.getStudentDifficulties(idAlumno, idCurso);
  }
}
