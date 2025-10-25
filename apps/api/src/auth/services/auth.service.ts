import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
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
}
