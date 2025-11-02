import { roles } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUserRequest extends Request {
  user: {
    userId: string;
    rol: roles;
  };
}

export interface UserPayload {
  userId: string;
  rol: roles;
}
