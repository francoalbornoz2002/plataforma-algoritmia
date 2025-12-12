import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocentesService } from '../services/docentes.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FindStudentProgressDto } from 'src/progress/dto/find-student-progress.dto';
import { FindStudentDifficultiesDto } from 'src/difficulties/dto/find-student-difficulties.dto';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { CreateRespuestaDto } from 'src/consultas/dto/create-respuesta.dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';

@UseGuards(RolesGuard)
//TODO: Quitar alumno de aqui, por el momento lo coloco pero no debería pasar.
@Roles(roles.Docente, roles.Alumno)
@Controller('docentes')
export class DocentesController {
  constructor(
    private readonly docentesService: DocentesService,
    private readonly consultasService: ConsultasService,
  ) {}

  @Get('my/courses')
  findMyCourses(@Req() req: AuthenticatedUserRequest) {
    return this.docentesService.findMyCourses(req.user.userId);
  }

  @Get('my/courses/:idCurso/progress-overview')
  getCourseOverview(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.getCourseOverview(idCurso, idDocente);
  }

  @Get('my/courses/:idCurso/progress-students')
  getStudentProgressList(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindStudentProgressDto, // <-- Recibe los filtros
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.getStudentProgressList(idCurso, dto, idDocente);
  }

  @Get('my/courses/:idCurso/difficulties-overview')
  getCourseDifficultiesOverview(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.getCourseDifficultiesOverview(
      idCurso,
      idDocente,
    );
  }

  @Get('my/courses/:idCurso/difficulties-list')
  getStudentDifficultyList(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindStudentDifficultiesDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.getStudentDifficultyList(
      idCurso,
      dto,
      idDocente,
    );
  }

  @Get('my/courses/:idCurso/student/:idAlumno/difficulties')
  getStudentDifficultiesDetail(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId; // <-- Añadido
    return this.docentesService.getStudentDifficultiesDetail(
      idAlumno,
      idCurso,
      idDocente,
    );
  }

  @Get('my/courses/:idCurso/student/:idAlumno/missions')
  getStudentMissions(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.getStudentMissions(
      idAlumno,
      idCurso,
      idDocente,
    );
  }

  @Get('my/courses/:idCurso/consults')
  findConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
    @Query() dto: FindConsultasDto, // <-- 3. Usar el DTO de filtros
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.findConsultas(idCurso, idDocente, dto);
  }

  @Post('my/consults/:idConsulta/respond')
  createRespuesta(
    @Param('idConsulta', ParseUUIDPipe) idConsulta: string,
    @Req() req: AuthenticatedUserRequest,
    @Body() dto: CreateRespuestaDto, // <-- 4. Usar el DTO de respuesta
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.createRespuesta(idConsulta, idDocente, dto);
  }

  @Get('my/courses/:idCurso/active-docentes')
  getActiveDocentes(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.findActiveDocentesByCurso(idCurso, idDocente);
  }

  // --- ¡NUEVO ENDPOINT 2! ---
  @Get('my/courses/:idCurso/pending-consultas')
  getPendingConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.consultasService.findPendingConsultasByCurso(idCurso);
  }
}
