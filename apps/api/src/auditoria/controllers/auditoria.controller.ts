import { Controller, Get, Query, UseGuards, Res, Req } from '@nestjs/common';
import type { Response } from 'express';
import { AuditoriaService } from '../services/auditoria.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  FindAuditoriaLogsDto,
  FindAuditoriaLogsPdfDto,
} from '../dto/find-audit-logs.dto';
import { PdfService } from '../../pdf/service/pdf.service';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
// (Asumo que JwtAuthGuard es global)

@Controller('auditoria')
@UseGuards(RolesGuard)
@Roles(roles.Administrador) // <-- ¡Solo Admins!
export class AuditoriaController {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Obtiene la lista paginada y filtrada de todos los logs de auditoría
   */
  @Get()
  findAll(@Query() dto: FindAuditoriaLogsDto) {
    return this.auditoriaService.findAll(dto);
  }

  @Get('pdf')
  async getAuditoriaLogsPdf(
    @Query() dto: FindAuditoriaLogsPdfDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const userId = req.user.userId;
    const file = await this.pdfService.getAuditoriaLogsPdf(dto, userId);
    res.set({
      'Content-Type': 'application/pdf',
    });
    return file;
  }
}
