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

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Get('all')
  @ApiCreatedResponse({ type: UserEntity, isArray: true })
  findAll(@Query() findAllUsersDto: FindAllUsersDto, @Req() req: AuthenticatedUserRequest) {
    const adminId = req.user.userId
    return this.usersService.findAll(findAllUsersDto, adminId);
  }

  @UseGuards(RolesGuard)
  @Get('teachers')
  @ApiCreatedResponse({ type: UserEntity, isArray: true })
  findTeachers() {
    return this.usersService.findTeachers();
  }

  @Get(':id')
  @ApiCreatedResponse({ type: UserEntity })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('edit/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(roles.Administrador)
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
