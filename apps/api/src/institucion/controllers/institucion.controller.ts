import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InstitucionService } from '../services/institucion.service';
import { UpdateInstitucionDto } from '../dto/update-institucion.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('institucion')
@UseGuards(RolesGuard)
export class InstitucionController {
  constructor(private readonly institucionService: InstitucionService) {}

  /**
   * Endpoint para que el Admin cree o actualice los datos de la institución
   */
  @Patch()
  @Roles(roles.Administrador)
  update(@Body() updateInstitucionDto: UpdateInstitucionDto) {
    return this.institucionService.upsert(updateInstitucionDto);
  }

  /**
   * Endpoint para que el Admin (y el frontend) obtengan los datos actuales
   */
  @Get()
  @Roles(roles.Administrador)
  findOne() {
    return this.institucionService.findOne();
  }

  /**
   * Endpoint para poblar el dropdown de Provincias
   */
  @Get('provincias')
  @Roles(roles.Administrador) // Solo el admin puede ver esto
  findProvincias() {
    return this.institucionService.findProvincias();
  }

  /**
   * Endpoint para la "cascada" del dropdown de Localidades
   */
  @Get('localidades/by-provincia/:idProvincia')
  @Roles(roles.Administrador)
  findLocalidades(@Param('idProvincia', ParseIntPipe) idProvincia: number) {
    return this.institucionService.findLocalidades(idProvincia);
  }
}
