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
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PreguntasService } from '../services/preguntas.service';
import { CreatePreguntaDto } from '../dto/create-pregunta.dto';
import { UpdatePreguntaDto } from '../dto/update-pregunta.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FindPreguntasDto } from '../dto/find-preguntas.dto';
import { FindSystemPreguntasDto } from '../dto/find-system-preguntas.dto';

@UseGuards(RolesGuard)
@Controller('preguntas')
export class PreguntasController {
  constructor(private readonly preguntasService: PreguntasService) {}

  @Post('create')
  create(@Req() req: AuthenticatedUserRequest, @Body() dto: CreatePreguntaDto) {
    return this.preguntasService.create(dto, req.user.userId);
  }

  @Get('all')
  findAll(@Query() findPreguntasDto: FindPreguntasDto) {
    return this.preguntasService.findAll(findPreguntasDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.preguntasService.findOne(+id);
  }

  @Roles(roles.Docente)
  @Get('sistema/for-sesion')
  findSystemPreguntasForSesion(@Query() dto: FindSystemPreguntasDto) {
    return this.preguntasService.findSystemPreguntasForSesion(
      dto.idDificultad,
      dto.gradoDificultad,
    );
  }

  @Roles(roles.Docente)
  @Patch('edit/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePreguntaDto: UpdatePreguntaDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.preguntasService.update(id, updatePreguntaDto, req.user.userId);
  }

  @Roles(roles.Docente)
  @Delete('delete/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.preguntasService.remove(id);
  }
}
