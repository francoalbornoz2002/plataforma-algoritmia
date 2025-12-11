import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SesionesRefuerzoService } from '../service/sesiones-refuerzo.service';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import { FindAllSesionesDto } from '../dto/find-all-sesiones.dto';

@UseGuards(RolesGuard)
@Controller('sesiones-refuerzo')
export class SesionesRefuerzoController {
  constructor(
    private readonly sesionesRefuerzoService: SesionesRefuerzoService,
  ) {}

  @Post(':idCurso')
  @Roles(roles.Docente)
  create(
    @Param('idCurso') idCurso: string,
    @Body() dto: CreateSesionesRefuerzoDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.sesionesRefuerzoService.create(idCurso, dto, req.user.userId);
  }

  @Get(':idCurso')
  @Roles(roles.Docente, roles.Alumno)
  findAll(
    @Param('idCurso') idCurso: string,
    @Query() dto: FindAllSesionesDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.sesionesRefuerzoService.findAll(idCurso, req.user, dto);
  }

  @Get(':idCurso/:id')
  @Roles(roles.Docente, roles.Alumno)
  findOne(
    @Param('idCurso') idCurso: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.sesionesRefuerzoService.findOne(idCurso, id, req.user);
  }

  @Patch(':idCurso/:id')
  @Roles(roles.Docente)
  update(
    @Param('idCurso') idCurso: string,
    @Param('id') id: string,
    @Body() dto: UpdateSesionesRefuerzoDto,
  ) {
    return this.sesionesRefuerzoService.update(idCurso, id, dto);
  }

  @Delete(':idCurso/:id')
  @Roles(roles.Docente)
  remove(@Param('idCurso') idCurso: string, @Param('id') id: string) {
    return this.sesionesRefuerzoService.remove(idCurso, id);
  }
}
