import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ConsultasService } from '../services/consultas.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { CreateConsultaDto } from '../dto/create-consulta.dto';
import { UpdateConsultaDto } from '../dto/update-consulta.dto';
import { ValorarConsultaDto } from '../dto/valorar-consulta.dto';
import { CreateRespuestaDto } from '../dto/create-respuesta.dto';

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
    return this.consultasService.delete(id, req.user.userId);
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

  @Post(':id/responder')
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
    @Body() dto: CreateRespuestaDto,
  ) {
    return this.consultasService.responder(id, req.user.userId, dto);
  }

  @Get(':idCurso/pendientes')
  getPendingConsultas(@Param('idCurso', ParseUUIDPipe) idCurso: string) {
    return this.consultasService.findPendingConsultasByCurso(idCurso);
  }
}
