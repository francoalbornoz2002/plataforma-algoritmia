import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles requeridos desde el decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se especificaron roles (@Roles()), se permite el acceso (o ajusta según tu lógica)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Obtiene el usuario del request
    const { user } = context.switchToHttp().getRequest();

    // Si no hay usuario (JwtAuthGuard no pasó o no se usó), niega el acceso
    if (!user || !user.rol) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este recurso (usuario no identificado).',
      );
    }

    // Compara el rol del usuario con los roles requeridos
    const hasRole = requiredRoles.some((rol) => user.rol === rol);

    if (!hasRole) {
      throw new ForbiddenException(
        `No tienes permiso para acceder a este recurso (rol ${user.rol} no autorizado).`,
      );
    }

    // Si tiene el rol requerido, permite el acceso
    return true;
  }
}
