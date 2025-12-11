import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { SesionesRefuerzoService } from '../service/sesiones-refuerzo.service';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

@Controller('sesiones-refuerzo')
export class SesionesRefuerzoController {
  constructor(
    private readonly sesionesRefuerzoService: SesionesRefuerzoService,
  ) {}

  @Post(':idCurso')
  create(
    @Param('idCurso') idCurso: string,
    @Body() dto: CreateSesionesRefuerzoDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    // Ahora el servicio sabe a qué curso pertenece la nueva sesión.
    return this.sesionesRefuerzoService.create(idCurso, dto, req.user.userId);
  }

  @Get(':idCurso')
  findAll(@Param('idCurso') idCurso: string) {
    // Filtra las sesiones por el curso especificado en la URL.
    return this.sesionesRefuerzoService.findAll(idCurso);
  }

  @Get(':idCurso/:id')
  findOne(@Param('idCurso') idCurso: string, @Param('id') id: string) {
    // Se busca la sesión `id` pero asegurando que pertenezca a `idCurso`.
    return this.sesionesRefuerzoService.findOne(idCurso, id);
  }

  @Patch(':idCurso/:id')
  update(
    @Param('idCurso') idCurso: string,
    @Param('id') id: string,
    @Body() dto: UpdateSesionesRefuerzoDto,
  ) {
    return this.sesionesRefuerzoService.update(idCurso, id, dto);
  }

  @Delete(':idCurso/:id')
  remove(@Param('idCurso') idCurso: string, @Param('id') id: string) {
    return this.sesionesRefuerzoService.remove(idCurso, id);
  }
}
