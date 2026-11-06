import apiClient from "../../../lib/axios";
// Usamos el tipo que ya existe
import type {
  Consulta,
  DificultadAlumnoDetallada,
  DocenteBasico,
  FindConsultasParams,
  MisionConEstado,
  ConsultaDocente,
  PaginatedConsultasDocenteResponse,
  CourseDashboardData,
} from "../../../types";
import type { CreateRespuestaFormValues } from "../../consultas/validations/createRespuesta.schema";

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

export const findConsultas = async (
  idCurso: string,
  params: FindConsultasParams,
): Promise<PaginatedConsultasDocenteResponse> => {
  try {
    // Limpiamos params (para filtros vacíos)
    const cleanedParams: Partial<FindConsultasParams> = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindConsultasParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      },
    );

    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/consults`, // <-- Usamos tu ruta 'my'
      {
        params: cleanedParams,
      },
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching course consults:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener las consultas del curso.")
    );
  }
};

/**
 * Envía una respuesta a una consulta (Docente)
 */
export const createRespuesta = async (
  idConsulta: string,
  data: CreateRespuestaFormValues,
): Promise<Consulta> => {
  try {
    const response = await apiClient.post(
      `/docentes/my/consults/${idConsulta}/respond`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error creating consult response:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al enviar la respuesta.");
  }
};

/**
 * Obtiene la lista de docentes activos de un curso (para filtros)
 */
export const findActiveDocentes = async (
  idCurso: string,
): Promise<DocenteBasico[]> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/active-docentes`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching active docentes:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener los docentes.");
  }
};

/**
 * Obtiene la lista de consultas pendientes de un curso
 */
export const findPendingConsultas = async (
  idCurso: string,
): Promise<ConsultaDocente[]> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/pending-consultas`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching pending consultas:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener las consultas pendientes.")
    );
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
