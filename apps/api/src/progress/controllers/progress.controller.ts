import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ProgressService } from '../services/progress.service';
import { SubmitMissionDto } from '../dto/submit-mission.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

@Controller('progreso')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':idCurso/resumen')
  getCourseProgressOverview(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idDocente = req.user.userId;
    return this.progressService.getCourseProgressOverview(idDocente, idCurso);
  }

  @Get(':idCurso/alumnos')
  getStudentProgressList(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idDocente = req.user.userId;
    return this.progressService.getStudentProgressList(idCurso, idDocente);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Alumno)
  @Get(':idCurso/mi-progreso')
  findMyProgress(
    @Req() req: AuthenticatedUserRequest,
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    return this.progressService.getStudentProgress(req.user.userId, idCurso);
  }

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
