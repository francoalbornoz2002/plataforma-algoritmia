import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { SubmitDifficultyDto } from '../dto/submit-difficulty.dto';
import { DifficultiesService } from '../services/difficulties.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Controller('difficulties')
export class DifficultiesController {
  constructor(private readonly difficultiesService: DifficultiesService) {}

  /**
   * Endpoint para que el videojuego registre/actualice una dificultad.
   */
  // @Public()
  // @Post('submit-difficulty')
  // submitDifficulty(@Body() submitDifficultyDto: SubmitDifficultyDto) {
  //   try {
  //     return this.difficultiesService.submitDifficulty(submitDifficultyDto);
  //   } catch (error) {
  //     if (error instanceof ForbiddenException) {
  //       throw new ForbiddenException(error.message);
  //     }
  //     throw error;
  //   }
  // }

  /**
   * Endpoint para obtener la lista de dificultades para filtros.
   */
  @Roles(roles.Docente, roles.Administrador)
  @Get('all')
  findAllForFilter() {
    return this.difficultiesService.findAllForFilter();
  }

  /**
   * Endpoint para que el videojuego registre/actualice una o varias dificultades.
   * TODO: Proteger esto con un Guardia de API Key.
   */
  @Public()
  @Post('submit-difficulties')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: [SubmitDifficultyDto] })
  async submitBatchDifficulties(@Body() dtos: SubmitDifficultyDto[]) {
    return this.difficultiesService.submitDifficulties(dtos);
  }
}
