import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';
import { UsersService } from 'src/users/services/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @Public()
  async login(@Body() data: LoginDto) {
    const userToken = await this.authService.login(data);

    if (!userToken)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return userToken;
  }

  @Post('game-login')
  @HttpCode(HttpStatus.OK)
  async gameLogin(@Body() gameLoginDto: LoginDto) {
    return this.usersService.findAlumnoForGame(gameLoginDto);
  }
}
