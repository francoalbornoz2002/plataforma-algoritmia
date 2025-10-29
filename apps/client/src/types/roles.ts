export type Rol = "Administrador" | "Docente" | "Alumno";
export const Roles = {
  Administrador: "Administrador",
  Docente: "Docente",
  Alumno: "Alumno",
} as const;
