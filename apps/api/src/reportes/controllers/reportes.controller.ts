import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from '../services/reportes.service';
import { GetUsersSummaryDto } from '../dto/get-users-summary.dto';
import { GetUsersDistributionDto } from '../dto/get-users-distribution.dto';
import { GetUsersHistoryDto } from '../dto/get-users-history.dto';
import { GetUsersListDto } from '../dto/get-users-list.dto';
import { GetCoursesReportDto } from '../dto/get-courses-report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { roles } from '@prisma/client';

@Controller('reportes')
@UseGuards(RolesGuard)
@Roles(roles.Administrador)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('usuarios/resumen')
  getUsersSummary(@Query() dto: GetUsersSummaryDto) {
    return this.reportesService.getUsersSummary(dto);
  }

  @Get('usuarios/distribucion')
  getUsersDistribution(@Query() dto: GetUsersDistributionDto) {
    return this.reportesService.getUsersDistribution(dto);
  }

  @Get('usuarios/altas')
  getUsersAltas(@Query() dto: GetUsersHistoryDto) {
    return this.reportesService.getUsersAltas(dto);
  }

  @Get('usuarios/bajas')
  getUsersBajas(@Query() dto: GetUsersHistoryDto) {
    return this.reportesService.getUsersBajas(dto);
  }

  @Get('usuarios/listado')
  getUsersList(@Query() dto: GetUsersListDto) {
    return this.reportesService.getUsersList(dto);
  }

  @Get('cursos')
  getCoursesReport(@Query() dto: GetCoursesReportDto) {
    return this.reportesService.getCoursesReport(dto);
  }
}
