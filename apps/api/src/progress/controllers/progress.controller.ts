import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ProgressService } from '../services/progress.service';
import { SubmitMissionDto } from '../dto/submit-mission.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Endpoint para que el videojuego registre una misión completada.
   */
  // TODO: Proteger esto con un Guardia de API Key
  @Public()
  @Post('submit-mission')
  @HttpCode(HttpStatus.OK)
  submitMission(@Body() submitMissionDto: SubmitMissionDto) {
    try {
      // Llamamos al servicio "cerebro"
      return this.progressService.submitMission(submitMissionDto);
    } catch (error) {
      // Manejar errores conocidos
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  /**
   * Endpoint para que el videojuego registre un lote de misiones completadas.
   */
  // TODO: Proteger esto con un Guardia de API Key
  @Post('submit-batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  // Aceptamos un ARRAY del DTO que ya tienes
  async submitBatchMissions(@Body() dtos: SubmitMissionDto[]) {
    return this.progressService.submitBatchMissions(dtos);
  }
}
