import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from '../services/reportes.service';
import { GetUsersSummaryDto } from '../dto/get-users-summary.dto';
import { GetUsersDistributionDto } from '../dto/get-users-distribution.dto';
import { GetUsersHistoryDto } from '../dto/get-users-history.dto';
import { GetUsersListDto } from '../dto/get-users-list.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import { GetCoursesSummaryDto } from '../dto/get-courses-summary.dto';
import { GetCoursesListDto } from '../dto/get-courses-list.dto';
import { GetCoursesHistoryDto } from '../dto/get-courses-history.dto';
import { GetStudentEnrollmentHistoryDto } from '../dto/get-student-enrollment-history.dto';
import { GetTeacherAssignmentHistoryDto } from '../dto/get-teacher-assignment-history.dto';
import { GetCourseMissionsReportDto } from '../dto/get-course-missions-report.dto';
import { GetCourseMissionDetailReportDto } from '../dto/get-course-mission-detail-report.dto';
import { GetCourseProgressSummaryDto } from '../dto/get-course-progress-summary.dto';
import { GetCourseDifficultiesReportDto } from '../dto/get-course-difficulties-report.dto';
import { GetCourseDifficultiesHistoryDto } from '../dto/get-course-difficulties-history.dto';
import { GetStudentDifficultiesReportDto } from '../dto/get-student-difficulties-report.dto';
import { GetCourseConsultationsSummaryDto } from '../dto/get-course-consultations-summary.dto';
import { GetCourseConsultationsHistoryDto } from '../dto/get-course-consultations-history.dto';
import { GetCourseClassesSummaryDto } from '../dto/get-course-classes-summary.dto';
import { GetCourseClassesHistoryDto } from '../dto/get-course-classes-history.dto';
import { GetCourseSessionsSummaryDto } from '../dto/get-course-sessions-summary.dto';
import { GetCourseSessionsHistoryDto } from '../dto/get-course-sessions-history.dto';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

@Controller('reportes')
@UseGuards(RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // --- REPORTES DE USUARIOS (ADMIN ONLY) ---

  @Get('usuarios/resumen')
  @Roles(roles.Administrador)
  getUsersSummary(@Query() dto: GetUsersSummaryDto) {
    return this.reportesService.getUsersSummary(dto);
  }

  @Get('usuarios/distribucion')
  @Roles(roles.Administrador)
  getUsersDistribution(@Query() dto: GetUsersDistributionDto) {
    return this.reportesService.getUsersDistribution(dto);
  }

  @Get('usuarios/altas')
  @Roles(roles.Administrador)
  getUsersAltas(@Query() dto: GetUsersHistoryDto) {
    return this.reportesService.getUsersAltas(dto);
  }

  @Get('usuarios/bajas')
  @Roles(roles.Administrador)
  getUsersBajas(@Query() dto: GetUsersHistoryDto) {
    return this.reportesService.getUsersBajas(dto);
  }

  @Get('usuarios/listado')
  @Roles(roles.Administrador)
  getUsersList(@Query() dto: GetUsersListDto) {
    return this.reportesService.getUsersList(dto);
  }

  // --- REPORTES DE CURSOS (ADMIN) ---

  // Sección 1: Resumen de cursos (KPIs y Gráficos)
  @Get('cursos/resumen')
  @Roles(roles.Administrador)
  getCoursesSummary(@Query() dto: GetCoursesSummaryDto) {
    return this.reportesService.getCoursesSummary(dto);
  }

  // Sección 1: Listado detallado de cursos
  @Get('cursos/listado')
  @Roles(roles.Administrador)
  getCoursesList(@Query() dto: GetCoursesListDto) {
    return this.reportesService.getCoursesList(dto);
  }

  // Sección 2: Historial de altas y bajas de cursos
  @Get('cursos/historial')
  @Roles(roles.Administrador)
  getCoursesHistory(@Query() dto: GetCoursesHistoryDto) {
    return this.reportesService.getCoursesHistory(dto);
  }

  // Sección 3: Historial de inscripciones y bajas de alumnos
  @Get('cursos/historial-inscripciones')
  @Roles(roles.Administrador)
  getStudentEnrollmentHistory(@Query() dto: GetStudentEnrollmentHistoryDto) {
    return this.reportesService.getStudentEnrollmentHistory(dto);
  }

  // Sección 4: Historial de asignaciones y bajas de docentes
  @Get('cursos/historial-asignaciones')
  @Roles(roles.Administrador)
  getTeacherAssignmentHistory(@Query() dto: GetTeacherAssignmentHistoryDto) {
    return this.reportesService.getTeacherAssignmentHistory(dto);
  }

  // --- REPORTES ESPECÍFICOS DE CURSO (ADMIN Y DOCENTE) ---

  // Progreso - Sección 1: Resumen de progreso del curso
  @Get('cursos/:id/progreso/resumen')
  @Roles(roles.Administrador, roles.Docente)
  getCourseProgressSummary(
    @Param('id') id: string,
    @Query() dto: GetCourseProgressSummaryDto,
  ) {
    return this.reportesService.getCourseProgressSummary(id, dto);
  }

  // Progreso - Sección 2: Reporte de Misiones Completadas
  @Get('cursos/:id/progreso/misiones')
  @Roles(roles.Administrador, roles.Docente)
  getCourseMissionsReport(
    @Param('id') id: string,
    @Query() dto: GetCourseMissionsReportDto,
  ) {
    return this.reportesService.getCourseMissionsReport(id, dto);
  }

  // Progreso - Sección 3: Detalles por Misión
  @Get('cursos/:id/progreso/detalle-mision')
  @Roles(roles.Administrador, roles.Docente)
  getCourseMissionDetailReport(
    @Param('id') id: string,
    @Query() dto: GetCourseMissionDetailReportDto,
  ) {
    return this.reportesService.getCourseMissionDetailReport(id, dto);
  }

  // Dificultades - Sección 1: Resumen de Dificultades
  @Get('cursos/:id/dificultades/resumen')
  @Roles(roles.Administrador, roles.Docente)
  getCourseDifficultiesReport(
    @Param('id') id: string,
    @Query() dto: GetCourseDifficultiesReportDto,
  ) {
    return this.reportesService.getCourseDifficultiesReport(id, dto);
  }

  // Dificultades - Sección 2: Historial de Dificultades
  @Get('cursos/:id/dificultades/historial')
  @Roles(roles.Administrador, roles.Docente)
  getCourseDifficultiesHistory(
    @Param('id') id: string,
    @Query() dto: GetCourseDifficultiesHistoryDto,
  ) {
    return this.reportesService.getCourseDifficultiesHistory(id, dto);
  }

  // Dificultades - Sección 3: Reporte por Alumno
  @Get('cursos/:id/dificultades/alumno')
  @Roles(roles.Administrador, roles.Docente)
  getStudentDifficultiesReport(
    @Param('id') id: string,
    @Query() dto: GetStudentDifficultiesReportDto,
  ) {
    return this.reportesService.getStudentDifficultiesReport(id, dto);
  }

  // Consultas - Sección 1: Resumen de Consultas
  @Get('cursos/:id/consultas/resumen')
  @Roles(roles.Administrador, roles.Docente)
  getCourseConsultationsSummary(
    @Param('id') id: string,
    @Query() dto: GetCourseConsultationsSummaryDto,
  ) {
    return this.reportesService.getCourseConsultationsSummary(id, dto);
  }

  // Consultas - Sección 2: Historial de Consultas
  @Get('cursos/:id/consultas/historial')
  @Roles(roles.Administrador, roles.Docente)
  getCourseConsultationsHistory(
    @Param('id') id: string,
    @Query() dto: GetCourseConsultationsHistoryDto,
  ) {
    return this.reportesService.getCourseConsultationsHistory(id, dto);
  }

  // Clases de Consulta - Sección 1: Resumen
  @Get('cursos/:id/clases-consulta/resumen')
  @Roles(roles.Administrador, roles.Docente)
  getCourseClassesSummary(
    @Param('id') id: string,
    @Query() dto: GetCourseClassesSummaryDto,
  ) {
    return this.reportesService.getCourseClassesSummary(id, dto);
  }

  // Clases de Consulta - Sección 2: Historial
  @Get('cursos/:id/clases-consulta/historial')
  @Roles(roles.Administrador, roles.Docente)
  getCourseClassesHistory(
    @Param('id') id: string,
    @Query() dto: GetCourseClassesHistoryDto,
  ) {
    return this.reportesService.getCourseClassesHistory(id, dto);
  }

  // Clases de Consulta - Sección 2: Historial (PDF)
  @Get('cursos/:id/clases-consulta/historial/pdf')
  @Roles(roles.Administrador, roles.Docente)
  async getCourseClassesHistoryPdf(
    @Param('id') id: string,
    @Query() dto: GetCourseClassesHistoryDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const userId = req.user.userId;
    const file = await this.reportesService.getCourseClassesHistoryPdf(
      id,
      dto,
      userId,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-clases-${id}.pdf"`,
    });
    return file;
  }

  // Sesiones de Refuerzo - Sección 1: Resumen
  @Get('cursos/:id/sesiones-refuerzo/resumen')
  @Roles(roles.Administrador, roles.Docente)
  getCourseSessionsSummary(
    @Param('id') id: string,
    @Query() dto: GetCourseSessionsSummaryDto,
  ) {
    return this.reportesService.getCourseSessionsSummary(id, dto);
  }

  // Sesiones de Refuerzo - Sección 2: Historial
  @Get('cursos/:id/sesiones-refuerzo/historial')
  @Roles(roles.Administrador, roles.Docente)
  getCourseSessionsHistory(
    @Param('id') id: string,
    @Query() dto: GetCourseSessionsHistoryDto,
  ) {
    return this.reportesService.getCourseSessionsHistory(id, dto);
  }
}
