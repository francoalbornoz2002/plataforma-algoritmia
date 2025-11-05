import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ProgressService } from '../services/progress.service';
import { SubmitMissionDto } from '../dto/submit-mission.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Endpoint para que el videojuego registre una misión completada.
   * TODO: Proteger esto con un Guardia de API Key en lugar de JWT.
   * Por ahora, lo dejamos abierto para probar con Swagger.
   */
  // @UseGuards(ApiKeyGuard)
  @Public()
  @Post('submit-mission')
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
}
