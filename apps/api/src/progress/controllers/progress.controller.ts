import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ProgressService } from '../services/progress.service';
import { SubmitMissionDto } from '../dto/submit-mission.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Endpoint para que el videojuego registre una misión completada.
   */
  // // TODO: Proteger esto con un Guardia de API Key
  // @Public()
  // @Post('submit-mission')
  // @HttpCode(HttpStatus.OK)
  // submitMission(@Body() submitMissionDto: SubmitMissionDto) {
  //   return this.progressService.submitMission(submitMissionDto);
  // }

  /**
   * Endpoint para que el videojuego registre y sincronice una o más misiones completadas.
   */
  // TODO: Proteger esto con un Guardia de API Key
  @Post('submit-missions')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: [SubmitMissionDto] })
  submitBatchMissions(@Body() dtos: SubmitMissionDto[]) {
    return this.progressService.submitMissions(dtos);
  }
}
