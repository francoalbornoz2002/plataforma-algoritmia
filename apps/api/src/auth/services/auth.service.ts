import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async login({ email, password }: LoginDto): Promise<{ accessToken: string }> {
    // Busca el usuario por email
    const foundUser = await this.prisma.usuario.findUnique({
      where: { email }, // Verifica que deletedAt sea null y controlar que no sea inactivo
    });

    if (foundUser?.deletedAt) {
      throw new UnauthorizedException('Este usuario está inactivo.');
    }

    // Si no se encuentra o la contraseña es incorrecta, lanza error
    if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Actualizamos el último acceso SOLO si ya tiene valor (no es el primer login).
    // Si es null, lo dejamos así para que el frontend detecte que debe cambiar contraseña.
    if (foundUser.ultimoAcceso) {
      await this.prisma.usuario.update({
        where: { id: foundUser.id },
        data: { ultimoAcceso: new Date() },
      });
    }

    // Generamos el payload
    const payload = {
      id: foundUser.id,
      rol: foundUser.rol,
    };

    // Si el email y contraseña son válidos, retorna el token
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });

    // Por seguridad, no indicamos si el usuario existe o no, pero si existe enviamos el mail.
    if (user && !user.deletedAt) {
      // Generamos un token de corta duración (15 min) específico para recuperación
      const payload = { sub: user.id, type: 'recovery' };
      const token = this.jwtService.sign(payload, { expiresIn: '15m' });

      await this.mailService.enviarRestablecerContrasena(
        user.email,
        user.nombre,
        token,
      );
    }

    return {
      message:
        'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'recovery') {
        throw new BadRequestException('Token inválido para esta operación.');
      }

      const userId = payload.sub;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.usuario.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { message: 'Contraseña actualizada correctamente.' };
    } catch (error) {
      throw new BadRequestException('El enlace es inválido o ha expirado.');
    }
  }
}
