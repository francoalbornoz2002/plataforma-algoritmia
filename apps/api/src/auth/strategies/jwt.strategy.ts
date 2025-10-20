import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Rol } from '@prisma/client';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { id: string; rol: Rol }) {
    console.log('VALIDATE CALLED! Payload:', payload); // <--- Añade esto
    if (!payload || !payload.id || !payload.rol) {
      console.error('Payload inválido o incompleto en validate!');
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.id,
      rol: payload.rol,
    };
  }
}
