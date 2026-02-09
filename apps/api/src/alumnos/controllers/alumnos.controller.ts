import {
  Body,
  Controller,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from '../services/alumnos.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { JoinCourseDto } from '../dto/join-course-dto';
import { CreateConsultaDto } from 'src/consultas/dto/create-consulta.dto';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { ValorarConsultaDto } from 'src/consultas/dto/valorar-consulta.dto';
import { UpdateConsultaDto } from 'src/consultas/dto/update-consulta.dto';

@UseGuards(RolesGuard)
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Roles(roles.Alumno)
  @Get('my/courses')
  findMyCourses(@Req() req: AuthenticatedUserRequest) {
    return this.alumnosService.findMyCourses(req.user.userId);
  }

  @Roles(roles.Alumno)
  @Post('my/join-course')
  joinCourse(
    @Req() req: AuthenticatedUserRequest, // Obtenemos el alumno del token
    @Body() joinCourseDto: JoinCourseDto, // Obtenemos { idCurso, contrasenaAcceso } del body
  ) {
    // Pasamos el usuario y el DTO completo al servicio
    return this.alumnosService.joinCourse(req.user, joinCourseDto);
  }

  @Roles(roles.Alumno)
  @Get('my/progress')
  findMyProgress(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string, // Recibimos el ID del curso
  ) {
    const idAlumno = req.user.userId; // Obtenemos el ID del alumno
    return this.alumnosService.findMyProgress(idAlumno, idCurso); // Llamamos al servicio
  }

  @Roles(roles.Alumno)
  @Get('my/difficulties')
  findMyDifficulties(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyDifficulties(idAlumno, idCurso);
  }

  @Roles(roles.Alumno)
  @Get('my/missions')
  findMyMissions(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyMissions(idAlumno, idCurso);
  }

  @Roles(roles.Alumno)
  @Get('my/courses/:idCurso/consults')
  findMyConsultas(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindConsultasDto,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyConsultas(idAlumno, idCurso, dto);
  }

  @Roles(roles.Alumno)
  @Get('course/:idCurso/consultas-publicas')
  findPublicConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindConsultasDto,
  ) {
    return this.alumnosService.findPublicConsultas(idCurso, dto);
  }

  @Roles(roles.Alumno)
  @Post('my/courses/:idCurso/consults/create')
  createConsulta(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Body() dto: CreateConsultaDto,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.createConsulta(idAlumno, idCurso, dto);
  }

  @Roles(roles.Alumno)
  @Patch('my/consults/edit/:idConsulta')
  updateConsulta(
    @Req() req: AuthenticatedUserRequest,
    @Param('idConsulta', ParseUUIDPipe) idConsulta: string,
    @Body() dto: UpdateConsultaDto,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.updateConsulta(idConsulta, idAlumno, dto);
  }

  @Roles(roles.Alumno)
  @Delete('my/consults/delete/:idConsulta')
  deleteConsulta(
    @Req() req: AuthenticatedUserRequest,
    @Param('idConsulta', ParseUUIDPipe) idConsulta: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.deleteConsulta(idConsulta, idAlumno);
  }

  @Roles(roles.Alumno)
  @Patch('my/consults/:idConsulta/valorar')
  valorarConsulta(
    @Req() req: AuthenticatedUserRequest,
    @Param('idConsulta', ParseUUIDPipe) idConsulta: string,
    @Body() dto: ValorarConsultaDto,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.valorarConsulta(idConsulta, idAlumno, dto);
  }

  @Roles(roles.Docente)
  @Get('my/courses/:idCurso/active-alumnos')
  getActiveAlumnos(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.alumnosService.findActiveAlumnosByCurso(idCurso, idDocente);
  }

  @Roles(roles.Docente)
  @Get('courses/:idCurso/elegibles-refuerzo')
  findEligibleForRefuerzo(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.alumnosService.findEligibleForRefuerzo(idCurso, idDocente);
  }

  @Roles(roles.Docente)
  @Get(':idAlumno/difficulties')
  getStudentDifficulties(
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    return this.alumnosService.findMyDifficulties(idAlumno, idCurso);
  }
}
