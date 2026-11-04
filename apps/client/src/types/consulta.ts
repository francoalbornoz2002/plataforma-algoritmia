import { temas, estado_consulta } from "./enums";
import type { BaseFilterParams, PaginatedResponse } from "./common";

export interface FindConsultasParams extends BaseFilterParams {
  tema?: temas | "";
  estado?: estado_consulta | "";
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

// 1. TIPO CONSULTA (Alumno)
export interface Consulta {
  id: string;
  idAlumno: string;
  idCurso: string;
  titulo: string;
  tema: temas;
  descripcion: string;
  createdAt: string;
  estado: estado_consulta;
  valoracionAlumno: number | null;
  comentarioValoracion: string | null;
  deletedAt: string | null;

  // La respuesta (si existe)
  respuestaConsulta: {
    id: string;
    descripcion: string;
    fechaRespuesta: string;
    docente: {
      nombre: string;
      apellido: string;
    };
  } | null;
}

// 2. TIPO PAGINADO (Para el Alumno)
export interface PaginatedConsultasResponse
  extends PaginatedResponse<Consulta> {}

// 3. TIPO EXTENDIDO (Para el Docente)
export interface ConsultaDocente extends Consulta {
  alumno: {
    nombre: string;
    apellido: string;
    fotoPerfilUrl?: string | null;
  };
}

// 4. TIPO PAGINADO (Para el Docente)
export interface PaginatedConsultasDocenteResponse
  extends PaginatedResponse<ConsultaDocente> {}
