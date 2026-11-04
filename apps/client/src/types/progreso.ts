import { estado_simple } from "./enums";
import type { Mision, MisionCompletada, MisionEspecial } from "./mision";

// Para el Resumen/KPIs (coincide con el modelo ProgresoCurso de Prisma)
export interface ProgresoCurso {
  id: string;
  misionesCompletadas: number;
  totalEstrellas: number;
  totalExp: number;
  totalIntentos: number;
  pctMisionesCompletadas: number; // Prisma usa Decimal, TS lo trata como number
  promEstrellas: number;
  promIntentos: number;
  estado: estado_simple;
  misionMasDificil?: Mision | null;
  alumnoMasActivo?: string | null;
}

// Para la DataGrid (ProgresoAlumno + nombre)
export interface ProgresoAlumnoDetallado {
  id: string;
  idAlumno: string;
  cantMisionesCompletadas: number;
  totalEstrellas: number;
  totalExp: number;
  totalIntentos: number;
  pctMisionesCompletadas: number;
  promEstrellas: number;
  promIntentos: number;
  fechaRegistro: string | null; // Llega como string ISO
  estado: estado_simple;
  // Campos añadidos por el servicio:
  nombre: string;
  apellido: string;
  fotoPerfilUrl?: string | null;
  dni?: string;
  fechaInscripcion?: string | Date;
  misionesCompletadas?: MisionCompletada[];
  misionesEspeciales?: MisionEspecial[];
}

export type ProgresoAlumno = Omit<
  ProgresoAlumnoDetallado,
  "nombre" | "apellido"
>;
