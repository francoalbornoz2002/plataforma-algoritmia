import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { roles } from '@prisma/client';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { id: string; rol: roles }) {
    if (!payload || !payload.id || !payload.rol) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.id,
      rol: payload.rol,
    };
  }
}
