import { dificultad_mision } from "./enums";

// 1. Tipo para la Misión Maestra (de la tabla 'misiones')
export interface Mision {
  id: string;
  numero: number;
  nombre: string;
  descripcion: string;
  dificultadMision: dificultad_mision;
}

// 2. Tipo para la Misión Completada (de la tabla 'mision_completada')
export interface MisionCompletada {
  id: string;
  idMision: string;
  idInscripcion: string;
  estrellas: number;
  exp: number;
  intentos: number;
  fechaCompletado: string | null; // Llega como string ISO
  mision: Mision;
}

// 3. Tipo para la respuesta "fusionada" del backend
export interface MisionConEstado {
  mision: Mision;
  completada: MisionCompletada | null; // null si está pendiente
}

// 4. Tipo para Misión Especial
export interface MisionEspecial {
  id: string; // UUID
  idInscripcion: string;
  nombre: string;
  descripcion: string;
  estrellas: number;
  exp: number;
  intentos: number;
  fechaCompletado: string;
}
