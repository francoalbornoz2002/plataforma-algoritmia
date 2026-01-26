import apiClient from "../../../lib/axios";
import {
  roles,
  estado_simple,
  dificultad_mision,
  fuente_cambio_dificultad,
} from "../../../types";

// --- Interfaces para Reportes de Usuarios (Modular) ---

export interface UsersSummaryFilters {
  fechaCorte?: string;
}

export enum AgrupacionUsuarios {
  ROL = "ROL",
  ESTADO = "ESTADO",
  AMBOS = "AMBOS",
}

export interface UsersDistributionFilters {
  fechaCorte?: string;
  agruparPor?: AgrupacionUsuarios;
}

export interface UsersHistoryFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  rol?: roles | "";
}

export interface UsersListFilters {
  fechaCorte?: string;
  rol?: roles | "";
}

export interface CoursesSummaryFilters {
  fechaCorte?: string;
}

export interface CoursesListFilters {
  fechaCorte?: string;
  estado?: estado_simple | "";
  search?: string;
}

export enum TipoMovimientoCurso {
  TODOS = "Todos",
  ALTA = "Alta",
  BAJA = "Baja",
}

export interface CoursesHistoryFilters {
  tipoMovimiento?: TipoMovimientoCurso | "";
  fechaDesde?: string;
  fechaHasta?: string;
}

export enum TipoMovimientoInscripcion {
  TODOS = "Todos",
  INSCRIPCION = "Inscripcion",
  BAJA = "Baja",
}

export interface StudentEnrollmentHistoryFilters {
  tipoMovimiento?: TipoMovimientoInscripcion | "";
  fechaDesde?: string;
  fechaHasta?: string;
  cursoId?: string;
}

export enum TipoMovimientoAsignacion {
  TODOS = "Todos",
  ASIGNACION = "Asignacion",
  BAJA = "Baja",
}

export interface TeacherAssignmentHistoryFilters {
  tipoMovimiento?: TipoMovimientoAsignacion | "";
  fechaDesde?: string;
  fechaHasta?: string;
  cursoId?: string;
}

// --- Interfaces para Reportes de Progreso de Curso Específico ---

export interface CourseProgressSummaryFilters {
  fechaCorte?: string;
}

export interface CourseMissionsReportFilters {
  dificultad?: dificultad_mision | "";
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CourseMissionDetailReportFilters {
  misionId?: string;
  dificultad?: dificultad_mision | "";
  fechaDesde?: string;
  fechaHasta?: string;
}

// --- Interfaces para Reportes de Dificultades ---

export interface CourseDifficultiesReportFilters {
  fechaCorte?: string;
}

export interface CourseDifficultiesHistoryFilters {
  temas?: string; // "Tema1,Tema2"
  dificultades?: string; // "id1,id2"
  fuente?: fuente_cambio_dificultad | "";
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface StudentDifficultiesReportFilters
  extends CourseDifficultiesHistoryFilters {
  studentId: string;
}

export interface CourseConsultationsSummaryFilters {
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CourseConsultationsHistoryFilters {
  temas?: string; // "Tema1,Tema2"
  estados?: string; // "Pendiente,Resuelta"
  alumnos?: string; // "id1,id2"
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CourseClassesSummaryFilters {
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CourseClassesHistoryFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  docenteId?: string;
}

// --- Endpoints Modulares de Usuarios ---

export const getUsersSummary = async (params: UsersSummaryFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios/resumen", {
    params: cleanParams,
  });
  return response.data;
};

export const getUsersDistribution = async (
  params: UsersDistributionFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios/distribucion", {
    params: cleanParams,
  });
  return response.data;
};

export const getUsersAltas = async (params: UsersHistoryFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios/altas", {
    params: cleanParams,
  });
  return response.data;
};

export const getUsersBajas = async (params: UsersHistoryFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios/bajas", {
    params: cleanParams,
  });
  return response.data;
};

export const getUsersList = async (params: UsersListFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios/listado", {
    params: cleanParams,
  });
  return response.data;
};

export const getCoursesSummary = async (params: CoursesSummaryFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/cursos/resumen", {
    params: cleanParams,
  });
  return response.data;
};

export const getCoursesList = async (params: CoursesListFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/cursos/listado", {
    params: cleanParams,
  });
  return response.data;
};

export const getCoursesHistory = async (params: CoursesHistoryFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/cursos/historial", {
    params: cleanParams,
  });
  return response.data;
};

export const getStudentEnrollmentHistory = async (
  params: StudentEnrollmentHistoryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    "/reportes/cursos/historial-inscripciones",
    {
      params: cleanParams,
    },
  );
  return response.data;
};

// --- Endpoints de Reportes de Curso Específico (Progreso) ---

export const getCourseProgressSummary = async (
  courseId: string,
  params?: CourseProgressSummaryFilters,
) => {
  const cleanParams = params
    ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== ""))
    : {};
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/progreso/resumen`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseMissionsReport = async (
  courseId: string,
  params: CourseMissionsReportFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/progreso/misiones`,
    {
      params: cleanParams,
    },
  );
  return response.data;
};

export const getCourseMissionDetailReport = async (
  courseId: string,
  params: CourseMissionDetailReportFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/progreso/detalle-mision`,
    {
      params: cleanParams,
    },
  );
  return response.data;
};

export const getCourseDifficultiesReport = async (
  courseId: string,
  params: CourseDifficultiesReportFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/dificultades/resumen`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseDifficultiesHistory = async (
  courseId: string,
  params: CourseDifficultiesHistoryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/dificultades/historial`,
    { params: cleanParams },
  );
  return response.data;
};

export const getStudentDifficultiesReport = async (
  courseId: string,
  params: StudentDifficultiesReportFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/dificultades/alumno`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseConsultationsSummary = async (
  courseId: string,
  params: CourseConsultationsSummaryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/consultas/resumen`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseConsultationsHistory = async (
  courseId: string,
  params: CourseConsultationsHistoryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/consultas/historial`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseClassesSummary = async (
  courseId: string,
  params: CourseClassesSummaryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/clases-consulta/resumen`,
    { params: cleanParams },
  );
  return response.data;
};

export const getCourseClassesHistory = async (
  courseId: string,
  params: CourseClassesHistoryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    `/reportes/cursos/${courseId}/clases-consulta/historial`,
    { params: cleanParams },
  );
  return response.data;
};

export const getTeacherAssignmentHistory = async (
  params: TeacherAssignmentHistoryFilters,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get(
    "/reportes/cursos/historial-asignaciones",
    {
      params: cleanParams,
    },
  );
  return response.data;
};
