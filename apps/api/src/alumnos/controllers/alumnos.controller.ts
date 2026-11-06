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
import { Public } from 'src/auth/decorators/public.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { CreateConsultaDto } from 'src/consultas/dto/create-consulta.dto';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { ValorarConsultaDto } from 'src/consultas/dto/valorar-consulta.dto';
import { UpdateConsultaDto } from 'src/consultas/dto/update-consulta.dto';

@UseGuards(RolesGuard)
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

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
}
