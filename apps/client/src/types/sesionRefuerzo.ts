import { grado_dificultad, estado_sesion, temas } from "./enums";
import type { PreguntaConDetalles } from "./pregunta";

// 1. Resultado de una sesión (básico)
export interface ResultadoSesion {
  id: string;
  idSesion: string;
  cantCorrectas: number;
  cantIncorrectas: number;
  pctAciertos: number | string; // Puede llegar como string (Decimal de Prisma) o number
  fechaCompletado: string;
  gradoAnterior: grado_dificultad;
  gradoNuevo: grado_dificultad;
  respuestasAlumno?: RespuestaAlumno[];
}

// Para la respuesta de un alumno a una pregunta específica
export interface RespuestaAlumno {
  idSesion: string;
  idPregunta: string;
  idOpcionElegida: string;
  esCorrecta: boolean;
}

// 2. Sesión de refuerzo para vistas de lista/resumen (lo que devuelve `findAll`)
export interface SesionRefuerzoResumen {
  id: string;
  idCurso: string;
  idAlumno: string;
  idDocente: string | null;
  idDificultad: string;
  nroSesion: number;
  gradoSesion: grado_dificultad;
  fechaHoraLimite: string;
  fechaInicioReal: string | null;
  tiempoLimite: number;
  estado: estado_sesion;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relaciones
  alumno: {
    id: string;
    nombre: string;
    apellido: string;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
  dificultad: {
    id: string;
    nombre: string;
    tema: temas;
  };
  resultadoSesion: ResultadoSesion | null;
}

// 3. Sesión de refuerzo con todos los detalles (lo que devuelve `findOne`)
export interface SesionRefuerzoConDetalles extends SesionRefuerzoResumen {
  curso: {
    id: string;
    nombre: string;
  };
  preguntas: {
    pregunta: PreguntaConDetalles;
  }[];
}

// 4. Para crear una sesión de refuerzo
export type CreateSesionRefuerzoData = {
  idAlumno: string;
  idDificultad: string;
  gradoSesion: grado_dificultad;
  fechaHoraLimite: Date | string;
  tiempoLimite: number; // en minutos
  preguntas: string[]; // array de IDs de preguntas
};

// 5. Para actualizar una sesión de refuerzo
export type UpdateSesionRefuerzoData = Partial<CreateSesionRefuerzoData>;

// 8. Para resolver una sesión (Payload)
export interface ResolverSesionPayload {
  respuestas: {
    idPregunta: string;
    idOpcionElegida: string;
  }[];
}

// 9. Respuesta al resolver una sesión
export interface ResolverSesionResponse {
  mensaje: string;
  resultados: {
    correctas: number;
    incorrectas: number;
    pctAciertos: number;
    nuevoGrado: grado_dificultad;
  };
}
