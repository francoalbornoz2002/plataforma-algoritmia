import { roles } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  rol: roles;
}
