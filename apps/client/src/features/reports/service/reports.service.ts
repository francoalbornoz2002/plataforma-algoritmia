import apiClient from "../../../lib/axios";
import { roles, estado_simple } from "../../../types";

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
