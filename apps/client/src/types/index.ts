import type { Rol } from "./roles";

export type Genero = "Masculino" | "Femenino" | "Otro";

// Defino el tipo Usuario de la respuesta de la API
export interface User {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  genero: Genero;
  email: string;
  rol: Rol;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

// Tipo para crear un usuario
export type CreateUserData = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "edad"
> & {
  password?: string;
};

// Tipo para actualizar un usuario: Hacemos todos los campos de CreateUsuarioData opcionales,
// y EXCLUIMOS 'email'
export type UpdateUserData = Partial<Omit<CreateUserData, "email">>;

// export interface Curso { ... }
