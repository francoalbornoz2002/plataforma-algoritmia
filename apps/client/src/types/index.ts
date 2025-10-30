import type { Rol } from "./roles";
export type Genero = "Masculino" | "Femenino" | "Otro";

export enum roles {
  Administrador = "Administrador",
  Docente = "Docente",
  Alumno = "Alumno",
}

export enum estado_simple {
  Activo = "Activo",
  Inactivo = "Inactivo",
}

export enum modalidad {
  Presencial = "Presencial",
  Virtual = "Virtual",
}

export enum dias_semana {
  Lunes = "Lunes",
  Martes = "Martes",
  Miercoles = "Miercoles",
  Jueves = "Jueves",
  Viernes = "Viernes",
  Sabado = "Sabado",
}

// --- INTERFACES ---

// Usuario de la respuesta de la API
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

// Un subconjunto del Usuario (solo lo que necesitamos en la Card de cursos)
export interface DocenteBasico {
  nombre: string;
  apellido: string;
}

// Representa la fila de la tabla intermedia 'docente_curso'
// Incluye el objeto anidado 'docente' que pedimos en el 'include'
export interface DocenteCursoConDocente {
  // No necesitamos idDocente, idCurso, estado aquí si solo mostramos el nombre
  docente: DocenteBasico;
}

// La interfaz principal para Curso (debe coincidir con los campos de tu model Curso)
export interface Curso {
  id: string;
  idProgreso: string; // O idProgresoCurso si renombraste
  idDificultadesCurso: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null; // Hacerlo opcional o nulable
  contrasenaAcceso: string; // El backend devuelve el hash, ¡no la muestres!
  modalidadPreferencial: modalidad;
  createdAt: string; // Las fechas llegan como strings ISO
  updatedAt: string;
  deletedAt?: string | null;
}

// La interfaz que representa CÓMO devuelve la API los datos
// (Curso + docentes anidados + conteo de alumnos)
export interface CursoConDetalles extends Curso {
  docentes: DocenteCursoConDocente[]; // Array de la interfaz intermedia
  _count: {
    alumnos: number;
  };
}

// La interfaz para la respuesta paginada completa de la API (Cursos)
export interface PaginatedCoursesResponse {
  data: CursoConDetalles[];
  total: number;
  page: number;
  totalPages: number;
}

// Interfaz para los parámetros de filtros (Cursos)
export interface FindCoursesParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  // ... otros filtros ...
}
