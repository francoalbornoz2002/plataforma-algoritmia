import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  Res,
  Req,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';
import { UsersService } from 'src/users/services/users.service';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @Public()
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(data);

    if (!tokens)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Configuramos la cookie segura
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, // No accesible por JS
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
      sameSite: 'strict', // Protección CSRF
      path: '/api/auth/', // Cubre refresh y logout
      // Si "Recordarme" es true, dura 7 días. Si no, es cookie de sesión (se borra al cerrar navegador)
      maxAge: data.remember ? 7 * 24 * 60 * 60 * 1000 : undefined,
    });

    // Solo devolvemos el accessToken al cliente
    return { accessToken: tokens.accessToken };
  }

  @Post('game-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async gameLogin(@Body() gameLoginDto: LoginDto) {
    return this.usersService.findAlumnoForGame(gameLoginDto);
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('refresh')
  @Public() // El Guard global bloquearía esto porque el access token expiró
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Actualizamos la cookie con el nuevo refresh token (rotación)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/',
      // Mantenemos la persistencia si ya existía (o reseteamos a 7 días)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @Public()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Obtenemos el refresh token de la cookie.
    // Es la fuente más confiable para el logout ya que persiste aunque el access token expire.
    const refreshToken = req.cookies['refreshToken'];

    if (refreshToken) {
      try {
        // Verificamos el token ignorando la expiración para poder limpiar la BD
        const payload = this.authService.verifyToken(refreshToken, true);
        if (payload?.id) {
          await this.authService.logout(payload.id);
        }
      } catch (error) {
        // Si el token es inválido, no hacemos nada, solo seguimos con la limpieza de cookies
      }
    }

    // Limpiamos la cookie
    res.clearCookie('refreshToken', { path: '/api/auth/' });

    return { message: 'Logged out successfully' };
  }
}
