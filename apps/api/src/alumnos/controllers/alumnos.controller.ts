import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from '../services/alumnos.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { JoinCourseDto } from '../dto/join-course-dto';

@UseGuards(RolesGuard)
@Roles(roles.Alumno)
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get('my/courses')
  findMyCourses(@Req() req: AuthenticatedUserRequest) {
    return this.alumnosService.findMyCourses(req.user.userId);
  }

  @Post('my/join-course')
  joinCourse(
    @Req() req: AuthenticatedUserRequest, // Obtenemos el alumno del token
    @Body() joinCourseDto: JoinCourseDto, // Obtenemos { idCurso, contrasenaAcceso } del body
  ) {
    // Pasamos el usuario y el DTO completo al servicio
    return this.alumnosService.joinCourse(req.user, joinCourseDto);
  }

  @Get('my/progress')
  findMyProgress(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string, // Recibimos el ID del curso
  ) {
    const idAlumno = req.user.userId; // Obtenemos el ID del alumno
    return this.alumnosService.findMyProgress(idAlumno, idCurso); // Llamamos al servicio
  }

  @Get('my/difficulties')
  findMyDifficulties(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyDifficulties(idAlumno, idCurso);
  }

  @Get('my/missions')
  findMyMissions(
    @Req() req: AuthenticatedUserRequest,
    @Query('idCurso', ParseUUIDPipe) idCurso: string,
  ) {
    const idAlumno = req.user.userId;
    return this.alumnosService.findMyMissions(idAlumno, idCurso);
  }
}
