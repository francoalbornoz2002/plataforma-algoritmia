import apiClient from "../../../lib/axios";
import type { FindLogsParams, PaginatedLogsResponse } from "../../../types";

/**
 * Obtiene la lista paginada y filtrada de logs de auditoría
 */
export const findLogs = async (
  params: FindLogsParams
): Promise<PaginatedLogsResponse> => {
  try {
    // 1. Limpiamos los parámetros (para no enviar 'tablaAfectada=""')
    const cleanedParams = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindLogsParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      }
    );

    // 2. Llamamos a la API
    const response = await apiClient.get("/auditoria", {
      params: cleanedParams,
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching audit logs:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data || new Error("Error al obtener los logs de auditoría.")
    );
  }
};
