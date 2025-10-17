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

  async validateUser({ email, password }: LoginDto) {
    // Busca el usuario por email
    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // Si no encuentra el usuario, se ejecuta un error
    if (!foundUser) {
      throw new UnauthorizedException('El email es incorrecto.');
    }

    // Si el usuario existe, compara la contraseña ingresada a la almacenada con el hash
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    // Si las contraseñas no son iguales, se ejecuta un error
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña es incorrecta.');
    }

    // Si el email y contraseña son válidos, retorna el token
    return this.jwtService.sign({
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
    });
  }
}
