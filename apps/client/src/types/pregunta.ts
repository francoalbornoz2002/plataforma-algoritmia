import { grado_dificultad, temas } from "./enums";
import type { BaseFilterParams } from "./common";

// 1. Opción de Respuesta
export interface OpcionRespuesta {
  id: string;
  textoOpcion: string;
  esCorrecta: boolean;
}

// 2. Pregunta (como la devuelve la API en `findAll`)
export interface PreguntaConDetalles {
  id: string;
  enunciado: string;
  gradoDificultad: grado_dificultad;
  idDificultad: string;
  idDocente: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relaciones incluidas
  opcionesRespuesta: OpcionRespuesta[];
  dificultad: {
    nombre: string;
    tema: temas;
  };
  docenteCreador: {
    nombre: string;
    apellido: string;
  } | null;
}

// 3. Para crear una pregunta
export type CreatePreguntaData = {
  enunciado: string;
  idDificultad: string;
  gradoDificultad: grado_dificultad;
  opcionesRespuesta: Omit<OpcionRespuesta, "id">[];
};

// 4. Para actualizar una pregunta
export type UpdatePreguntaData = Partial<CreatePreguntaData>;

// 5. Para los filtros de búsqueda
export interface FindPreguntasParams extends BaseFilterParams {
  search?: string;
  tema?: temas | "";
  idDificultad?: string;
  gradoDificultad?: grado_dificultad | "";
  tipo?: "sistema" | "docente" | "";
}

// 6. Para la respuesta paginada
export interface PaginatedPreguntasResponse {
  data: PreguntaConDetalles[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// 7. Para buscar preguntas de sistema para una sesión
export interface FindSystemPreguntasParams {
  idDificultad: string;
  gradoDificultad: grado_dificultad;
}
