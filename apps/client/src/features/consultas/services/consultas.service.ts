import apiClient from "../../../lib/axios";
import type {
  Consulta,
  FindConsultasParams,
  PaginatedConsultasDocenteResponse,
  PaginatedConsultasResponse,
} from "../../../types";
import type {
  CreateConsultaFormValues,
  UpdateConsultaFormValues,
} from "../validations/consulta.schema";

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

    const response = await apiClient.get(`/consultas/${idCurso}`, {
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
 * Obtiene la lista paginada y filtrada de consultas del alumno
 */
export const getMyConsultas = async (
  idCurso: string,
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
      `/consultas/${idCurso}/mis-consultas`,
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

/**
 * Obtiene la lista paginada de consultas PÚBLICAS del curso
 */
export const getPublicConsultas = async (
  idCurso: string,
  params: FindConsultasParams,
): Promise<PaginatedConsultasDocenteResponse> => {
  try {
    const cleanedParams: Partial<FindConsultasParams> = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindConsultasParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      },
    );

    const response = await apiClient.get(
      `/consultas/${idCurso}/consultas-publicas`,
      {
        params: cleanedParams,
      },
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching public consults:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data || new Error("Error al obtener consultas públicas.")
    );
  }
};
