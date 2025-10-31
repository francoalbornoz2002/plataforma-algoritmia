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

/* ---------------------- INTERFACES ---------------------- */

// ----- USUARIOS ----- //

// Interfaz principal para Usuario
// También representa CÓMO devuelve la API los datos del usuario
export interface UserData {
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

// Tipo para crear un usuario. Omitimos el id y los timestampsz
export type CreateUserData = Omit<
  UserData,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "edad"
> & {
  password?: string;
};

// Tipo para actualizar un usuario: todos los campos de CreateUsuarioData opcionales,
// y EXCLUIMOS 'email'
export type UpdateUserData = Partial<Omit<CreateUserData, "email">>;

// ----- CURSOS ----- //

// La interfaz principal para Curso
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

// Información del docente para la Card de cursos (Un subconjunto del Usuario)
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

// La interfaz que representa CÓMO devuelve la API los datos del curso
// (Curso + docentes anidados + conteo de alumnos)
export interface CursoConDetalles extends Curso {
  docentes: DocenteCursoConDocente[]; // Array de la interfaz intermedia
  _count: {
    alumnos: number;
  };
}

export interface DocenteParaFiltro {
  id: string;
  nombre: string;
  apellido: string;
}

// Interfaz base para los parámetros de búsqueda y filtros
export interface BaseFilterParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

// Interfaz base para la respuesta paginada de la API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
