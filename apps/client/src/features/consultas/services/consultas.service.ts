import apiClient from "../../../lib/axios";
import type {
  FindConsultasParams,
  PaginatedConsultasResponse,
} from "../../../types";

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
