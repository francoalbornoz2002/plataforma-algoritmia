import apiClient from "../../../lib/axios";
import type { CourseDashboardData } from "../../../types";

/**
 * Obtiene las estadísticas del dashboard para un curso (Docente)
 */
export const getCourseDashboardStats = async (
  idCurso: string,
): Promise<CourseDashboardData> => {
  try {
    const response = await apiClient.get(`/cursos/${idCurso}/dashboard-stats`);
    return response.data;
  } catch (err: any) {
    console.error("Error fetching dashboard stats:", err);
    throw err.response?.data || new Error("Error al obtener estadísticas.");
  }
};
