import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles } from '@prisma/client';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(RolesGuard)
@Controller('usuarios')
@ApiTags('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(roles.Administrador)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(roles.Administrador)
  @Get()
  @ApiCreatedResponse({ type: UserEntity, isArray: true })
  findAll(
    @Query() findAllUsersDto: FindAllUsersDto,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const adminId = req.user.userId;
    return this.usersService.findAll(findAllUsersDto, adminId);
  }

  @Get('docentes')
  @ApiCreatedResponse({ type: UserEntity, isArray: true })
  findTeachers() {
    return this.usersService.findTeachers();
  }

  @Roles(roles.Alumno, roles.Docente)
  @Get('cursos')
  findUserCourses(@Req() req: AuthenticatedUserRequest) {
    return this.usersService.findUserCourses(req.user.userId, req.user.rol);
  }

  @Roles(roles.Administrador)
  @Get('admin-dashboard-stats')
  getAdminDashboardStats() {
    return this.usersService.getAdminDashboardStats();
  }

  @Get(':id')
  @ApiCreatedResponse({ type: UserEntity })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(roles.Administrador)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/perfil')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() fotoPerfil: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, fotoPerfil);
  }

  @Roles(roles.Administrador)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
