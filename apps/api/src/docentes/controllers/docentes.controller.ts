import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

@UseGuards(RolesGuard)
@Roles(roles.Docente)
@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

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
}
