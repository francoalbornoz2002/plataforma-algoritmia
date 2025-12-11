import apiClient from "../../../lib/axios";
import type {
  CreateSesionRefuerzoData,
  FindSesionesParams,
  PaginatedSesionesResponse,
  SesionRefuerzoConDetalles,
  SesionRefuerzoResumen,
  UpdateSesionRefuerzoData,
} from "../../../types";

/**
 * Busca y devuelve una lista paginada de sesiones de refuerzo para un curso.
 * @param idCurso - El ID del curso.
 * @param params - Parámetros de paginación y filtro.
 */
export const findAllSesiones = async (
  idCurso: string,
  params: FindSesionesParams
): Promise<PaginatedSesionesResponse> => {
  const response = await apiClient.get<PaginatedSesionesResponse>(
    `/sesiones-refuerzo/${idCurso}`,
    { params }
  );
  return response.data;
};

/**
 * Busca y devuelve los detalles completos de una sesión de refuerzo específica.
 * @param idCurso - El ID del curso.
 * @param idSesion - El ID de la sesión de refuerzo.
 */
export const findSesionById = async (
  idCurso: string,
  idSesion: string
): Promise<SesionRefuerzoConDetalles> => {
  const response = await apiClient.get<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}`
  );
  return response.data;
};

/**
 * Crea una nueva sesión de refuerzo.
 * Utiliza FormData porque el backend espera `preguntas` como un JSON stringificado.
 * @param idCurso - El ID del curso donde se creará la sesión.
 * @param data - Los datos para la nueva sesión.
 */
export const createSesion = async (
  idCurso: string,
  data: CreateSesionRefuerzoData
): Promise<SesionRefuerzoConDetalles> => {
  const formData = new FormData();

  // Nota: El backend debe poder manejar la conversión de string a número para 'tiempoLimite'
  // y de string a fecha para 'fechaHoraLimite'.
  Object.entries(data).forEach(([key, value]) => {
    if (key === "preguntas" && Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await apiClient.post<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Actualiza una sesión de refuerzo existente.
 * @param idCurso - El ID del curso.
 * @param idSesion - El ID de la sesión a actualizar.
 * @param data - Los datos a modificar.
 */
export const updateSesion = async (
  idCurso: string,
  idSesion: string,
  data: UpdateSesionRefuerzoData
): Promise<SesionRefuerzoConDetalles> => {
  const response = await apiClient.patch<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}`,
    data
  );
  return response.data;
};

/**
 * Cancela (baja lógica) una sesión de refuerzo.
 * @param idCurso - El ID del curso.
 * @param idSesion - El ID de la sesión a cancelar.
 */
export const deleteSesion = async (
  idCurso: string,
  idSesion: string
): Promise<SesionRefuerzoResumen> => {
  const response = await apiClient.delete<SesionRefuerzoResumen>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}`
  );
  return response.data;
};
