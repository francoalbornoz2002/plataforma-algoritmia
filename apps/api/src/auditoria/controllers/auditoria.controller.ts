import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from '../services/auditoria.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FindAuditoriaLogsDto } from '../dto/find-audit-logs.dto';
// (Asumo que JwtAuthGuard es global)

@Controller('auditoria')
@UseGuards(RolesGuard)
@Roles(roles.Administrador) // <-- ¡Solo Admins!
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  /**
   * Obtiene la lista paginada y filtrada de todos los logs de auditoría
   */
  @Get()
  findAll(@Query() dto: FindAuditoriaLogsDto) {
    return this.auditoriaService.findAll(dto);
  }
}
