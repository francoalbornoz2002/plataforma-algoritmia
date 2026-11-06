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
} from '@nestjs/common';
import { SesionesRefuerzoService } from '../service/sesiones-refuerzo.service';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import { ResolverSesionDto } from '../dto/resolver-sesion.dto';

@UseGuards(RolesGuard)
@Controller('sesiones-refuerzo')
export class SesionesRefuerzoController {
  constructor(
    private readonly sesionesRefuerzoService: SesionesRefuerzoService,
  ) {}

  @Post()
  @Roles(roles.Docente)
  create(
    @Body() dto: CreateSesionesRefuerzoDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.sesionesRefuerzoService.create(dto, req.user.userId);
  }

  @Get(':id')
  @Roles(roles.Docente, roles.Alumno)
  findOne(@Param('id') id: string, @Req() req: AuthenticatedUserRequest) {
    return this.sesionesRefuerzoService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(roles.Docente)
  update(@Param('id') id: string, @Body() dto: UpdateSesionesRefuerzoDto) {
    return this.sesionesRefuerzoService.update(id, dto);
  }

  @Delete(':id')
  @Roles(roles.Docente)
  remove(@Param('id') id: string) {
    return this.sesionesRefuerzoService.remove(id);
  }

  @Post(':id/iniciar')
  @Roles(roles.Alumno)
  iniciarSesion(@Param('id') id: string, @Req() req: AuthenticatedUserRequest) {
    return this.sesionesRefuerzoService.iniciarSesion(id, req.user.userId);
  }

  @Post(':id/resolver')
  @Roles(roles.Alumno)
  resolverSesion(
    @Param('id') id: string,
    @Body() dto: ResolverSesionDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.sesionesRefuerzoService.resolverSesion(
      id,
      req.user.userId,
      dto,
    );
  }
}
