import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SubmitDifficultyDto } from '../dto/submit-difficulty.dto';
import { DifficultiesService } from '../services/difficulties.service';
import { Public } from 'src/auth/decorators/public.decorator';

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
   * Endpoint para que el videojuego registre/actualice una o varias dificultades.
   * TODO: Proteger esto con un Guardia de API Key.
   */
  @Public()
  @Post('submit-difficulties')
  @HttpCode(HttpStatus.OK)
  async submitBatchDifficulties(@Body() dtos: SubmitDifficultyDto[]) {
    return this.difficultiesService.submitDifficulties(dtos);
  }
}
