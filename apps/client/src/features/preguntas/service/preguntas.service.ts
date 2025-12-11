import apiClient from "../../../lib/axios";
import type {
  CreatePreguntaData,
  FindPreguntasParams,
  FindSystemPreguntasParams,
  PaginatedPreguntasResponse,
  PreguntaConDetalles,
  UpdatePreguntaData,
} from "../../../types";

const findAll = async (
  params: FindPreguntasParams
): Promise<PaginatedPreguntasResponse> => {
  try {
    // Usamos la opción 'params' de axios para construir la query string
    const response = await apiClient.get("/preguntas/all", { params });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al buscar las preguntas:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al buscar las preguntas.");
  }
};

const findOne = async (id: string): Promise<PreguntaConDetalles> => {
  try {
    const response = await apiClient.get(`/preguntas/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error al buscar la pregunta ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al buscar la pregunta.");
  }
};

const create = async (
  data: CreatePreguntaData
): Promise<PreguntaConDetalles> => {
  try {
    const response = await apiClient.post("/preguntas/create", data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al crear la pregunta:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al crear la pregunta.");
  }
};

const update = async (
  id: string,
  data: UpdatePreguntaData
): Promise<PreguntaConDetalles> => {
  try {
    const response = await apiClient.patch(`/preguntas/edit/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error al actualizar la pregunta ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al actualizar la pregunta.");
  }
};

const remove = async (id: string): Promise<PreguntaConDetalles> => {
  try {
    const response = await apiClient.delete(`/preguntas/delete/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error al eliminar la pregunta ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al eliminar la pregunta.");
  }
};

export const findSystemPreguntasForSesion = async (
  params: FindSystemPreguntasParams
): Promise<PreguntaConDetalles[]> => {
  try {
    const response = await apiClient.get("/preguntas/sistema/for-sesion", {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al buscar preguntas de sistema:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al buscar preguntas de sistema.")
    );
  }
};

export const preguntasService = {
  findAll,
  findOne,
  create,
  update,
  remove,
  findSystemPreguntasForSesion,
};
