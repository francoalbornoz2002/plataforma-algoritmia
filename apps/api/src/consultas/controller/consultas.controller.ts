import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateConsultaDto } from '../dto/create-consulta.dto';
import { UpdateConsultaDto } from '../dto/update-consulta.dto';
import { ValorarConsultaDto } from '../dto/valorar-consulta.dto';

@UseGuards(RolesGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Roles(roles.Alumno)
  @Post()
  create(@Req() req: AuthenticatedUserRequest, @Body() dto: CreateConsultaDto) {
    return this.consultasService.create(req.user.userId, dto);
  }

  @Roles(roles.Alumno)
  @Patch(':id')
  update(
    @Req() req: AuthenticatedUserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultaDto,
  ) {
    return this.consultasService.update(id, req.user.userId, dto);
  }

  @Roles(roles.Alumno)
  @Delete(':id')
  delete(
    @Req() req: AuthenticatedUserRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.consultasService.deleteConsulta(id, req.user.userId);
  }

  @Roles(roles.Alumno)
  @Patch(':id/valorar')
  valorar(
    @Req() req: AuthenticatedUserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValorarConsultaDto,
  ) {
    const idAlumno = req.user.userId;
    return this.consultasService.valorar(id, req.user.userId, dto);
  }

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

  @Roles(roles.Alumno)
  @Get(':idCurso/consultas-publicas')
  findPublicConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Query() dto: FindConsultasDto,
  ) {
    return this.consultasService.findConsultasPublicas(idCurso, dto);
  }
}
