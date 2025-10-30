import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';

import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CoursesService } from '../services/courses.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticationRequest } from 'src/interfaces/authenticated-user.interface';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Post('create')
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get('all')
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch('edit/:id')
  @UseGuards(RolesGuard)
  @Roles(roles.Administrador, roles.Docente)
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: AuthenticationRequest,
  ) {
    // Obtenemos el rol del token JWT (inyectado por el Guard)
    const userRole = req.user.rol;

    return this.coursesService.update(id, updateCourseDto, userRole);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
