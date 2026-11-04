import { temas, grado_dificultad, estado_simple } from "./enums";

// 1. Para el Resumen/KPIs de Dificultades
export interface DificultadesCurso {
  id: string;
  idCurso: string;
  temaModa: temas;
  idDificultadModa: string | null;
  promDificultades: number;
  promGrado: grado_dificultad;
  estado: estado_simple;
  dificultadModa?: {
    nombre: string;
  };
  alumnoCritico?: string | null;
}

// 2. Para la DataGrid de Dificultades del Docente
export interface AlumnoDificultadResumen {
  id: string; // id del ALUMNO
  nombre: string;
  apellido: string;
  totalDificultades: number;
  gradoAlto: number;
  gradoMedio: number;
  gradoBajo: number;
  gradoNinguno: number;
  dificultadesDetalle?: {
    idDificultad: string;
    tema: temas;
    grado: grado_dificultad;
  }[];
}

export interface DificultadSimple {
  id: string;
  nombre: string;
}

export interface DificultadAlumnoDetallada extends DificultadSimple {
  descripcion: string;
  tema: temas;
  grado: grado_dificultad; // El grado del alumno
}

// Para el filtrado de dificultades por tema en formularios
export interface DificultadConTema extends DificultadSimple {
  tema: temas;
}
