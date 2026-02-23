import apiClient from "../../../lib/axios";
import type {
  ClaseConsulta,
  // FindClasesConsultaParams, // (Lo usaremos si paginamos)
  CreateClaseConsultaPayload,
  UpdateClaseConsultaPayload,
} from "../../../types";

/**
 * Obtiene TODAS las clases de consulta de un curso
 * (Para Alumno y Docente)
 */
export const findAllClasesByCurso = async (
  idCurso: string,
): Promise<ClaseConsulta[]> => {
  try {
    const response = await apiClient.get(
      // Usamos la ruta que definimos en el controller
      `/clases-consulta/all/${idCurso}`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching clases de consulta:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener las clases de consulta.")
    );
  }
};

/**
 * Crea una nueva clase de consulta (Docente)
 */
export const createClaseConsulta = async (
  data: CreateClaseConsultaPayload,
  idCurso: string, // El DTO del backend espera idCurso
): Promise<ClaseConsulta> => {
  try {
    const payload = {
      ...data,
      idCurso: idCurso, // Añadimos el idCurso del contexto
    };

    const response = await apiClient.post(`/clases-consulta/create`, payload);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error creating clase de consulta:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al crear la clase.");
  }
};

/**
 * Actualiza una clase de consulta (Docente)
 */
export const updateClaseConsulta = async (
  idClase: string,
  data: UpdateClaseConsultaPayload,
): Promise<ClaseConsulta> => {
  try {
    const response = await apiClient.patch(
      `/clases-consulta/edit/${idClase}`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error updating clase de consulta:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al actualizar la clase.");
  }
};

/**
 * Cancela (Soft Delete) una clase de consulta (Docente)
 */
export const deleteClaseConsulta = async (
  idClase: string,
  motivo: string,
): Promise<ClaseConsulta> => {
  try {
    const response = await apiClient.patch(
      `/clases-consulta/${idClase}/cancelar`,
      { motivo },
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error deleting clase de consulta:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al cancelar la clase.");
  }
};

// Método para aceptar/tomar una clase automática
export const aceptarClaseAutomatica = async (
  idClase: string,
  nuevaFecha?: string, // <--- Opcional
): Promise<void> => {
  try {
    // Enviamos la fecha en el body si existe
    await apiClient.patch(`/clases-consulta/${idClase}/asignar`, {
      nuevaFecha,
    });
  } catch (error: any) {
    // Manejo de errores (ej: si ya la tomó otro)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("No se pudo aceptar la clase.");
  }
};

export const finalizarClase = async (
  idClase: string,
  data: {
    realizada: boolean;
    motivo?: string;
    consultasRevisadasIds?: string[];
  },
) => {
  // Preparamos el payload que espera el DTO
  const payload = {
    realizada: data.realizada,
    motivo: data.motivo, // El backend lo guardará en la tabla nueva
    consultasRevisadasIds: data.consultasRevisadasIds,
  };

  const response = await apiClient.patch(
    `/clases-consulta/${idClase}/finalizar`,
    payload,
  );
  return response.data;
};
