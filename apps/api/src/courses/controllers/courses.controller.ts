import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CoursesService } from '../services/courses.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FindAllCoursesDto } from '../dto/find-all-courses.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JoinCourseDto } from 'src/courses/dto/join-course-dto';
import { ClasesConsultaService } from 'src/clases-consulta/services/clases-consulta.service';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';

@UseGuards(RolesGuard)
@Controller('cursos')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly clasesConsultaService: ClasesConsultaService,
    private readonly consultasService: ConsultasService,
  ) {}

  @Roles(roles.Administrador)
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() imagen: Express.Multer.File,
  ) {
    return this.coursesService.create(createCourseDto, imagen);
  }

  @Get()
  findAll(@Query() query: FindAllCoursesDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Roles(roles.Administrador, roles.Docente)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() imagen: Express.Multer.File,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.coursesService.update(id, updateCourseDto, imagen, req.user);
  }

  @Roles(roles.Administrador)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Delete(':id/alumnos/:idAlumno/baja')
  removeStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.coursesService.removeStudent(id, idAlumno, idDocente);
  }

  @Roles(roles.Administrador)
  @Patch(':id/finalizar')
  finalize(@Param('id') id: string) {
    return this.coursesService.finalize(id);
  }

  @Roles(roles.Alumno)
  @Post(':id/inscribirse')
  joinCourse(
    @Req() req: AuthenticatedUserRequest,
    @Body() dto: JoinCourseDto,
    @Param('id', ParseUUIDPipe) idCurso: string,
  ) {
    return this.coursesService.joinCourse(req.user.userId, idCurso, dto);
  }

  @Roles(roles.Docente)
  @Get(':id/alumnos-activos')
  getActiveAlumnos(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.coursesService.findActiveAlumnosByCurso(id, idDocente);
  }

  @Get(':id/docentes-activos')
  getActiveDocentes(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.coursesService.findActiveDocentesByCurso(
      id,
      req.user.userId,
      req.user.rol,
    );
  }

  @Roles(roles.Docente)
  @Get(':id/alumnos-aptos-refuerzo')
  findEligibleForRefuerzo(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.coursesService.findEligibleForRefuerzo(id, idDocente);
  }

  @Roles(roles.Docente, roles.Alumno)
  @Get(':id/consultas')
  findAllConsultas(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
    @Query() dto: FindConsultasDto,
  ) {
    return this.consultasService.findConsultasForCurso(
      id,
      req.user.userId,
      req.user.rol,
      dto,
    );
  }

  @Get(':id/consultas/pendientes')
  getPendingConsultas(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultasService.findPendingConsultasByCurso(id);
  }

  @Roles(roles.Alumno)
  @Get(':id/alumnos/:idAlumno/consultas')
  findAllConsultasForAlumno(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Query() dto: FindConsultasDto,
  ) {
    return this.consultasService.findConsultasForAlumno(idAlumno, id, dto);
  }

  @Get(':id/clases-consulta')
  @Roles(roles.Alumno, roles.Docente)
  findAllClasesConsulta(
    @Param('idCurso') idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.clasesConsultaService.findAll(idCurso, req.user);
  }

  @Roles(roles.Docente, roles.Administrador)
  @Get(':id/dashboard-stats')
  getDashboardStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getDashboardStats(id);
  }

  @Roles(roles.Alumno)
  @Get(':id/student-dashboard')
  getStudentDashboardStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.coursesService.getStudentDashboardStats(id, req.user.userId);
  }
}
