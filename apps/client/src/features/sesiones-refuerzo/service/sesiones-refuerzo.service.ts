import apiClient from "../../../lib/axios";
import type {
  CreateSesionRefuerzoData,
  FindSesionesParams,
  PaginatedSesionesResponse,
  ResolverSesionPayload,
  ResolverSesionResponse,
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
 * Marca el inicio de una sesión de refuerzo por parte del alumno.
 * Esto es importante para validar el tiempo límite en el servidor.
 * @param idCurso - El ID del curso.
 * @param idSesion - El ID de la sesión.
 */
export const iniciarSesion = async (
  idCurso: string,
  idSesion: string
): Promise<SesionRefuerzoConDetalles> => {
  const response = await apiClient.post<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}/iniciar`
  );
  return response.data;
};

/**
 * Envía las respuestas de una sesión de refuerzo para su calificación.
 * @param idCurso - El ID del curso.
 * @param idSesion - El ID de la sesión.
 * @param data - Las respuestas del alumno.
 */
export const resolverSesion = async (
  idCurso: string,
  idSesion: string,
  data: ResolverSesionPayload
): Promise<ResolverSesionResponse> => {
  const response = await apiClient.post<ResolverSesionResponse>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}/resolver`,
    data
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
  // Convertimos la fecha a un string ISO, que es el formato estándar para JSON.
  const payload = {
    ...data,
    fechaHoraLimite: new Date(data.fechaHoraLimite).toISOString(),
  };

  const response = await apiClient.post<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}`,
    payload // Enviamos el objeto JS directamente. Axios lo convierte a JSON.
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
  const payload = { ...data };
  // Si fechaHoraLimite se está actualizando, nos aseguramos que esté en formato ISO string.
  if (payload.fechaHoraLimite && typeof payload.fechaHoraLimite !== "string") {
    payload.fechaHoraLimite = new Date(payload.fechaHoraLimite).toISOString();
  }

  const response = await apiClient.patch<SesionRefuerzoConDetalles>(
    `/sesiones-refuerzo/${idCurso}/${idSesion}`,
    payload
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
