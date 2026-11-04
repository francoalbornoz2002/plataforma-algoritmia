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
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CoursesService } from '../services/courses.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FindAllCoursesDto } from '../dto/find-all-courses.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cursos')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() imagen: Express.Multer.File,
  ) {
    return this.coursesService.create(createCourseDto, imagen);
  }

  @Get()
  findAll(@Query() query: FindAllCoursesDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador, roles.Docente)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() imagen: Express.Multer.File,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.coursesService.update(id, updateCourseDto, imagen, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Patch(':id/finalizar')
  finalize(@Param('id') id: string) {
    return this.coursesService.finalize(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Docente, roles.Administrador)
  @Get(':id/dashboard-stats')
  getDashboardStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getDashboardStats(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Alumno)
  @Get(':id/student-dashboard')
  getStudentDashboardStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    return this.coursesService.getStudentDashboardStats(id, req.user.userId);
  }
}
