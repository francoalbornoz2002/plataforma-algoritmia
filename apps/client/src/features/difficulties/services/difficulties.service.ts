import apiClient from "../../../lib/axios";
import type {
  AlumnoDificultadResumen,
  DificultadAlumnoDetallada,
  DificultadConTema,
  DificultadesCurso,
} from "../../../types";

/**
 * Obtiene la lista completa de dificultades para los filtros.
 */
export async function getAllDifficulties(): Promise<DificultadConTema[]> {
  try {
    // (Asegúrate de que 'apiClient' esté configurado)
    const response = await apiClient.get("/dificultades");
    return response.data;
  } catch (error) {
    console.error("Error fetching all difficulties:", error);
    throw new Error("No se pudo cargar la lista de dificultades.");
  }
}

/**
 * Siendo alumno, obtiene mis dificultades en un curso específico.
 * @param idCurso - El ID del curso.
 */
export const getMyDifficulties = async (
  idCurso: string,
): Promise<DificultadAlumnoDetallada[]> => {
  try {
    const response = await apiClient.get(
      `/dificultades/${idCurso}/mis-dificultades`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulties:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tus dificultades.");
  }
};

/**
 * Obtiene las dificultades detalladas de un alumno específico en un curso.
 * @param idCurso - El ID del curso.
 * @param idAlumno - El ID del alumno.
 */
export const getStudentDifficulties = async (
  idCurso: string,
  idAlumno: string,
): Promise<DificultadAlumnoDetallada[]> => {
  const response = await apiClient.get(`/dificultades/${idCurso}/${idAlumno}/`);
  return response.data;
};

/**
 * Obtiene el Resumen (KPIs) de Dificultades de un curso
 */
export const getCourseDifficultiesOverview = async (
  idCurso: string,
): Promise<DificultadesCurso> => {
  try {
    const response = await apiClient.get(`/dificultades/${idCurso}/resumen`);
    // Convertimos los Decimal a Number si es necesario
    response.data.promDificultades = parseFloat(response.data.promDificultades);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching difficulties overview:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener el resumen de dificultades.")
    );
  }
};

/**
 * Obtiene la lista paginada de alumnos para la DataGrid de Dificultades
 */
export const getStudentDifficultyList = async (
  idCurso: string,
): Promise<AlumnoDificultadResumen[]> => {
  try {
    const response = await apiClient.get(`/dificultades/${idCurso}/alumnos`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulty list:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data || new Error("Error al obtener la lista de alumnos.")
    );
  }
};
