import { Role } from "@prisma/client";
import { Request } from "express";

export interface AuthenticationRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  }
}