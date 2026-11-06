import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from '../services/alumnos.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { ValorarConsultaDto } from 'src/consultas/dto/valorar-consulta.dto';

@UseGuards(RolesGuard)
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

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
