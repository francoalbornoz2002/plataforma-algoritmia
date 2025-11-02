import apiClient from "../lib/axios";
// Usamos el tipo que ya existe
import type { CursoParaEditar, estado_simple } from "../types";

// Usamos la misma 'shape' que el servicio de alumnos
export interface AsignacionConCurso {
  idDocente: string;
  idCurso: string;
  estado: estado_simple;
  curso: CursoParaEditar; // <-- Usamos el tipo acordado
}

/**
 * Busca todos los cursos (activos e inactivos) de un docente
 */
export const findMyCourses = async (): Promise<AsignacionConCurso[]> => {
  try {
    const response = await apiClient.get("/docentes/my/courses");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching teacher's courses:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tus cursos.");
  }
};
