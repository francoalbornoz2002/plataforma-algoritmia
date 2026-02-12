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

  async login({
    email,
    password,
  }: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
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

    // 1. Generar Access Token (Corta duración: 15m - 2h según config)
    const accessToken = this.jwtService.sign(payload);

    // 2. Generar Refresh Token (Larga duración: 7 días)
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' }, // Añadimos tipo para diferenciar
      { expiresIn: '7d' },
    );

    // 3. Hashear y guardar el Refresh Token en la BD
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: foundUser.id,
        hashedToken: hashedRefreshToken,
        expiresAt: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
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

  verifyToken(token: string, ignoreExpiration = false) {
    return this.jwtService.verify(token, { ignoreExpiration });
  }

  async refreshTokens(oldRefreshToken: string) {
    try {
      // 1. Verificar la firma del token
      const payload = this.jwtService.verify(oldRefreshToken);
      const userId = payload.id;

      // 2. Buscar el token en la base de datos (por usuario)
      // Nota: No podemos buscar por el hash directamente, así que buscamos los tokens del usuario
      // y comparamos. O idealmente, el payload del refresh token debería tener un ID de sesión,
      // pero para simplificar iteramos los tokens válidos del usuario.
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: { userId },
      });

      const tokenRecord = storedTokens.find((t) =>
        bcrypt.compareSync(oldRefreshToken, t.hashedToken),
      );

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token no válido o revocado.');
      }

      // 3. Verificar expiración de BD
      if (new Date() > tokenRecord.expiresAt) {
        await this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException('Refresh token expirado.');
      }

      // 4. Rotación de Tokens: Borramos el usado y creamos uno nuevo
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

      const newPayload = { id: userId, rol: payload.rol };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, type: 'refresh' },
        { expiresIn: '7d' },
      );

      const newHashedToken = await bcrypt.hash(newRefreshToken, 10);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await this.prisma.refreshToken.create({
        data: {
          userId,
          hashedToken: newHashedToken,
          expiresAt: newExpiresAt,
        },
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (e) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }
  }

  async logout(userId: string) {
    // Opción simple: Borrar todos los refresh tokens del usuario (Cierra sesión en todos los dispositivos)
    // Opción avanzada: Borrar solo el token específico de la cookie (requiere pasar el token al logout)
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
