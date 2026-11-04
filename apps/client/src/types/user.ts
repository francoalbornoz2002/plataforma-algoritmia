import { roles } from "./enums";

// Interfaz principal para Usuario
// También representa CÓMO devuelve la API los datos del usuario
export interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  rol: roles;
  fotoPerfilUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

// Tipo para CREAR un usuario. Omitimos los campos que maneja la BD
export type CreateUserData = Omit<
  UserData,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "edad"
> & {
  password?: string;
};

// Tipo para ACTUALIZAR un usuario: todos los campos de CreateUsuarioData opcionales,
// y EXCLUIMOS 'email'
export type UpdateUserData = Partial<Omit<CreateUserData, "email">>;

// Información del docente para la Card de cursos (Un subconjunto del Usuario)
export interface DocenteBasico {
  id: string;
  nombre: string;
  apellido: string;
}

export interface DocenteParaFiltro {
  id: string;
  nombre: string;
  apellido: string;
  fotoPerfilUrl?: string | null;
}
