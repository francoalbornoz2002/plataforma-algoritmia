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
import { JoinCourseDto } from '../dto/join-course-dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Post('create')
  @UseInterceptors(FileInterceptor('imagen'))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() imagen: Express.Multer.File,
  ) {
    return this.coursesService.create(createCourseDto, imagen);
  }

  @Get('all')
  findAll(@Query() query: FindAllCoursesDto) {
    // The global ValidationPipe (in main.ts) automatically validates 'query'
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador, roles.Docente)
  @Patch('edit/:id')
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
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Alumno)
  @Post(':id/join')
  join(
    @Param('id', ParseUUIDPipe) idCurso: string, // Obtenemos el ID del curso de la URL
    @Req() req: AuthenticatedUserRequest, // Obtenemos el usuario (alumno) del token
    @Body() joinCourseDto: JoinCourseDto, // Obtenemos la contraseña del body
  ) {
    console.log('USER DEL REQUEST:', req.user);
    return this.coursesService.join(req.user, idCurso, joinCourseDto);
  }
}
