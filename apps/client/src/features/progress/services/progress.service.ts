import apiClient from "../../../lib/axios";
import type {
  ProgresoAlumno,
  ProgresoAlumnoDetallado,
  ProgresoCurso,
} from "../../../types";

/**
 * Siendo alumno, obtiene mi progreso en un curso específico.
 * @param idCurso - El ID del curso.
 */
export const getMyProgress = async (
  idCurso: string,
): Promise<ProgresoAlumno> => {
  try {
    const response = await apiClient.get(`/progreso/${idCurso}/mi-progreso`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student progress:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tu progreso.");
  }
};

/**
 * Obtiene el Resumen (KPIs) de un curso específico
 */
export const getCourseProgressOverview = async (
  idCurso: string,
): Promise<ProgresoCurso> => {
  try {
    const response = await apiClient.get(`/progreso/${idCurso}/resumen`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching course overview:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data || new Error("Error al obtener el resumen del curso.")
    );
  }
};

/**
 * Obtiene la lista paginada y filtrada de alumnos y su progreso
 */
export const getStudentProgressList = async (
  idCurso: string,
): Promise<ProgresoAlumnoDetallado[]> => {
  try {
    const response = await apiClient.get(`/progreso/${idCurso}/alumnos`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student progress list:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener el progreso de los alumnos.")
    );
  }
};
