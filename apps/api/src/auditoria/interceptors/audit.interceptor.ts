// src/auditoria/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { auditStorage } from './audit.storage';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor() {} // Ya no necesita Prisma

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<AuthenticatedUserRequest>();
    const userId = req.user?.userId; // O 'user.id', etc.

    if (userId) {
      // Ejecuta el resto de la solicitud DENTRO del contexto
      return auditStorage.run({ userId }, () => next.handle());
    }
    return next.handle();
  }
}
