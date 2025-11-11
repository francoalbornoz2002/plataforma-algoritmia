import apiClient from "../../../lib/axios";
import type {
  ClaseConsulta,
  // FindClasesConsultaParams, // (Lo usaremos si paginamos)
} from "../../../types";

// Importamos los DTOs del frontend
import type {
  CreateClaseConsultaFormValues,
  UpdateClaseConsultaFormValues,
} from "../validations/clase-consulta.schema";

/**
 * Obtiene TODAS las clases de consulta de un curso
 * (Para Alumno y Docente)
 */
export const findAllClasesByCurso = async (
  idCurso: string
): Promise<ClaseConsulta[]> => {
  try {
    const response = await apiClient.get(
      // Usamos la ruta que definimos en el controller
      `/clases-consulta/all/${idCurso}`
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching clases de consulta:",
      err.response?.data || err.message
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
  data: CreateClaseConsultaFormValues,
  idCurso: string // El DTO del backend espera idCurso
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
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al crear la clase.");
  }
};

/**
 * Actualiza una clase de consulta (Docente)
 */
export const updateClaseConsulta = async (
  idClase: string,
  data: UpdateClaseConsultaFormValues
): Promise<ClaseConsulta> => {
  try {
    const response = await apiClient.patch(
      `/clases-consulta/edit/${idClase}`,
      data
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error updating clase de consulta:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al actualizar la clase.");
  }
};

/**
 * Cancela (Soft Delete) una clase de consulta (Docente)
 */
export const deleteClaseConsulta = async (
  idClase: string
): Promise<ClaseConsulta> => {
  try {
    const response = await apiClient.delete(
      `/clases-consulta/delete/${idClase}`
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error deleting clase de consulta:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al cancelar la clase.");
  }
};
