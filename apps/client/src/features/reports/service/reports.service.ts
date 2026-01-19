import apiClient from "../../../lib/axios";
import { roles, estado_simple } from "../../../types";

export interface UsersReportFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  rol?: roles | "";
}

export interface CoursesReportFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: estado_simple | "";
}

export const getUsersReport = async (params: UsersReportFilters) => {
  // Limpiamos los parámetros vacíos para no enviarlos
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/usuarios", {
    params: cleanParams,
  });
  return response.data;
};

export const getCoursesReport = async (params: CoursesReportFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/cursos", {
    params: cleanParams,
  });
  return response.data;
};
