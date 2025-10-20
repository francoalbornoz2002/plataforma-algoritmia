import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() data: LoginDto) {
    const userToken = await this.authService.login(data);

    if (!userToken)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return userToken;
  }
}
