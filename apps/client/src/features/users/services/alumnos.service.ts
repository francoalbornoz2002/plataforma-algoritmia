import apiClient from "../../../lib/axios";
import type { Consulta, DocenteBasico } from "../../../types";
import type { UpdateConsultaFormValues } from "../../consultas/validations/consulta.schema";
import type { ValorarConsultaFormValues } from "../../consultas/validations/valorarConsulta.schema";

/**
 * Edita una consulta existente (Alumno)
 */
export const updateConsulta = async (
  idConsulta: string,
  data: UpdateConsultaFormValues, // Usamos el DTO de Update
): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "edit"
    const response = await apiClient.patch(
      `/alumnos/my/consults/edit/${idConsulta}`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error updating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al actualizar la consulta.");
  }
};

// --- ¡NUEVA FUNCIÓN DE BORRADO! ---
/**
 * Borra (soft delete) una consulta (Alumno)
 */
export const deleteConsulta = async (idConsulta: string): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "delete"
    const response = await apiClient.delete(
      `/alumnos/my/consults/delete/${idConsulta}`,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error deleting consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al borrar la consulta.");
  }
};

/**
 * Valora una respuesta (Alumno)
 */
export const valorarConsulta = async (
  idConsulta: string,
  data: ValorarConsultaFormValues,
): Promise<Consulta> => {
  try {
    const response = await apiClient.patch(
      `/alumnos/my/consults/${idConsulta}/valorar`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error rating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al valorar la consulta.");
  }
};

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
