import apiClient from "../../../lib/axios";
// Usamos el tipo que ya existe
import type {
  DocenteBasico,
  ConsultaDocente,
  CourseDashboardData,
} from "../../../types";

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

/**
 * Da de baja a un alumno de un curso (Docente)
 */
export const removeStudentFromCourse = async (
  idCurso: string,
  idAlumno: string,
): Promise<void> => {
  try {
    await apiClient.delete(
      `/docentes/my/courses/${idCurso}/students/${idAlumno}`,
    );
  } catch (err: any) {
    console.error(
      "Error removing student from course:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al dar de baja al alumno.");
  }
};
