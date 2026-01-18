import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from '../services/reportes.service';
import { GetUsersReportDto } from '../dto/get-users-report.dto';
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

  @Get('usuarios')
  getUsersReport(@Query() dto: GetUsersReportDto) {
    return this.reportesService.getUsersReport(dto);
  }

  @Get('cursos')
  getCoursesReport(@Query() dto: GetCoursesReportDto) {
    return this.reportesService.getCoursesReport(dto);
  }
}
