import {
  Controller,
  Get,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from '../services/alumnos.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

@UseGuards(RolesGuard)
@Roles(roles.Alumno)
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get('my/courses')
  findMyCourses(@Req() req: AuthenticatedUserRequest) {
    return this.alumnosService.findMyCourses(req.user.userId);
  }

  @Get('my/progress')
  findMyProgress(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string, // 3. Recibir el ID del curso
  ) {
    const idAlumno = req.user.userId; // 4. Obtener el ID del alumno
    return this.alumnosService.findMyProgress(idAlumno, idCurso); // 5. Llamar al servicio
  }

  @Get('my/difficulties')
  findMyDifficulties(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyDifficulties(idAlumno, idCurso);
  }
}
