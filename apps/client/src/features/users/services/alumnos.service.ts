import apiClient from "../../../lib/axios";
import type { DocenteBasico } from "../../../types";

/**
 * Obtiene la lista de alumnos activos de un curso (para filtros).
 * @param idCurso - El ID del curso.
 */
export const findActiveAlumnos = async (
  idCurso: string,
): Promise<DocenteBasico[]> => {
  try {
    // Asumimos que existe un endpoint para esto, similar a active-docentes.
    const response = await apiClient.get(
      `/alumnos/my/courses/${idCurso}/active-alumnos`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching active alumnos:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener la lista de alumnos activos.")
    );
  }
};

/**
 * Obtiene la lista de alumnos de un curso que son elegibles para una sesión de refuerzo
 * (es decir, que tienen al menos una dificultad registrada).
 * @param idCurso - El ID del curso.
 */
export interface AlumnoElegible {
  id: string;
  nombre: string;
  apellido: string;
  fotoPerfilUrl: string | null;
  totalDificultades: number;
  gradoAlto: number;
  gradoMedio: number;
  gradoBajo: number;
}

export const findEligibleAlumnos = async (
  idCurso: string,
): Promise<AlumnoElegible[]> => {
  try {
    // NOTA: Asumimos que este endpoint existe para optimizar la carga.
    const response = await apiClient.get(
      `/alumnos/courses/${idCurso}/elegibles-refuerzo`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching eligible alumnos:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener la lista de alumnos elegibles.")
    );
  }
};
