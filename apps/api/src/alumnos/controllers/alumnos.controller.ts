import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
