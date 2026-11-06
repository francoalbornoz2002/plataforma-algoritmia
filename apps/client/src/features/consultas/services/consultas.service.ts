import apiClient from "../../../lib/axios";
import type {
  Consulta,
  ConsultaDocente,
  FindConsultasParams,
  PaginatedConsultasDocenteResponse,
  PaginatedConsultasResponse,
} from "../../../types";
import type {
  CreateConsultaFormValues,
  UpdateConsultaFormValues,
} from "../validations/consulta.schema";
import type { ResponderConsultaFormValues } from "../validations/responderConsulta.schema";
import type { ValorarConsultaFormValues } from "../validations/valorarConsulta.schema";

/**
 * Crea una nueva consulta (Alumno)
 */
export const createConsulta = async (
  idCurso: string,
  data: CreateConsultaFormValues,
): Promise<Consulta> => {
  try {
    const payload = {
      ...data,
      idCurso: idCurso,
    };

    const response = await apiClient.post(`/consultas`, payload);
    return response.data;
  } catch (err: any) {
    console.error("Error creating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al crear la consulta.");
  }
};

/**
 * Edita una consulta existente (Alumno)
 */
export const updateConsulta = async (
  idConsulta: string,
  data: UpdateConsultaFormValues,
): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "edit"
    const response = await apiClient.patch(`/consultas/${idConsulta}`, data);
    return response.data;
  } catch (err: any) {
    console.error("Error updating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al actualizar la consulta.");
  }
};

/**
 * Borra (soft delete) una consulta (Alumno)
 */
export const deleteConsulta = async (idConsulta: string): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "delete"
    const response = await apiClient.delete(`/consultas/${idConsulta}`);
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
      `/consultas/${idConsulta}/valorar`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error rating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al valorar la consulta.");
  }
};

/**
 * Envía una respuesta a una consulta (Docente)
 */
export const responderConsulta = async (
  idConsulta: string,
  data: ResponderConsultaFormValues,
): Promise<Consulta> => {
  try {
    const response = await apiClient.post(
      `/consultas/${idConsulta}/responder`,
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

export const findConsultasForCurso = async (
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

    const response = await apiClient.get(`/cursos/${idCurso}/consultas`, {
      params: cleanedParams,
    });
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
 * Obtiene la lista de consultas pendientes de un curso
 */
export const findPendingConsultas = async (
  idCurso: string,
): Promise<ConsultaDocente[]> => {
  try {
    const response = await apiClient.get(`/consultas/${idCurso}/pendientes`);
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
 * Obtiene la lista paginada y filtrada de consultas del alumno
 */
export const findConsultasForAlumno = async (
  idCurso: string,
  idAlumno: string | undefined,
  params: FindConsultasParams,
): Promise<PaginatedConsultasResponse> => {
  try {
    // Limpiamos los params (filtros vacíos)
    const cleanedParams: Partial<FindConsultasParams> = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindConsultasParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      },
    );

    const response = await apiClient.get(
      `/cursos/${idCurso}/alumnos/${idAlumno}/consultas`,
      {
        params: cleanedParams,
      },
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student consults:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tus consultas.");
  }
};
