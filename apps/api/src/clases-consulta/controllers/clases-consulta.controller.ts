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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClasesConsultaService } from '../services/clases-consulta.service';
import { CreateClasesConsultaDto } from '../dto/create-clases-consulta.dto';
import { UpdateClasesConsultaDto } from '../dto/update-clases-consulta.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FinalizarClaseDto } from '../dto/finalizar-clase.dto';

@UseGuards(RolesGuard) // JwtGuard se aplica globalmente.
@Controller('clases-consulta')
export class ClasesConsultaController {
  constructor(private readonly clasesConsultaService: ClasesConsultaService) {}

  @Get('all/:idCurso')
  @Roles(roles.Alumno, roles.Docente)
  findAllForCurso(
    @Param('idCurso') idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.clasesConsultaService.findAll(idCurso, req.user);
  }

  @Post('create')
  @Roles(roles.Docente)
  create(
    @Body() dto: CreateClasesConsultaDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.clasesConsultaService.create(dto, req.user);
  }

  @Patch('edit/:id')
  @Roles(roles.Docente)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClasesConsultaDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.clasesConsultaService.update(id, dto, req.user);
  }

  @Delete('delete/:id')
  @Roles(roles.Docente)
  remove(@Param('id') id: string, @Req() req: AuthenticatedUserRequest) {
    return this.clasesConsultaService.remove(id, req.user);
  }

  @Patch(':id/aceptar-reprogramar')
  @Roles(roles.Docente)
  async aceptarYReprogramar(
    @Param('id', ParseUUIDPipe) idClase: string,
    @Body() body: { fechaClase: string; horaInicio: string; horaFin: string },
    @Req() req: any,
  ) {
    const idDocente = req.user.userId; // Tu ID de usuario
    return this.clasesConsultaService.aceptarYReprogramar(
      idClase,
      idDocente,
      body,
    );
  }

  @Patch(':id/asignar')
  @Roles(roles.Docente)
  async asignarDocente(
    @Param('id', ParseUUIDPipe) idClase: string,
    @Body('nuevaFecha') nuevaFecha: string | undefined, // <--- Leemos del body
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.clasesConsultaService.asignarDocente(
      idClase,
      idDocente,
      nuevaFecha,
    );
  }

  @Patch(':id/finalizar')
  @Roles(roles.Docente, roles.Administrador) // Protegido para docentes y admin
  finalizar(
    @Param('id') id: string,
    @Body() dto: FinalizarClaseDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.clasesConsultaService.finalizar(id, dto, req.user);
  }
}
