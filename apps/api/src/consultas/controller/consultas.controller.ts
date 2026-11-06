import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ConsultasService } from '../services/consultas.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FindConsultasDto } from '../dto/find-consultas.dto';

@UseGuards(RolesGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Roles(roles.Docente)
  @Get(':idCurso')
  findConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
    @Query() dto: FindConsultasDto,
  ) {
    const idDocente = req.user.userId;
    return this.consultasService.findConsultasForDocente(
      idCurso,
      idDocente,
      dto,
    );
  }

  @Roles(roles.Alumno)
  @Get(':idCurso/mis-consultas')
  findMyConsultas(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindConsultasDto,
  ) {
    const idAlumno = req.user.userId;
    return this.consultasService.findConsultasForAlumno(idAlumno, idCurso, dto);
  }
}
