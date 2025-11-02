import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DocentesService } from '../services/docentes.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';

@UseGuards(RolesGuard)
@Roles(roles.Docente)
@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

  @Get('my/courses')
  findMyCourses(@Req() req: AuthenticatedUserRequest) {
    return this.docentesService.findMyCourses(req.user.userId);
  }
}
