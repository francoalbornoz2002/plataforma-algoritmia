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
} from '@nestjs/common';
import { ClasesConsultaService } from '../services/clases-consulta.service';
import { CreateClasesConsultaDto } from '../dto/create-clases-consulta.dto';
import { UpdateClasesConsultaDto } from '../dto/update-clases-consulta.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

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
}
