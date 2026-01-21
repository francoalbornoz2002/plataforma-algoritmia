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

export interface CoursesReportFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: estado_simple | "";
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

export const getCoursesReport = async (params: CoursesReportFilters) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== ""),
  );
  const response = await apiClient.get("/reportes/cursos", {
    params: cleanParams,
  });
  return response.data;
};
