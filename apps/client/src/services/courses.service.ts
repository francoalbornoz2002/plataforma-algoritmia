// src/services/courses.service.ts

import apiClient from "../lib/axios";
import type {
  DocenteParaFiltro,
  BaseFilterParams,
  estado_simple,
  CursoConDetalles,
  PaginatedResponse,
} from "../types";

// Interfaz para los parámetros de búsqueda
export interface FindCoursesParams extends BaseFilterParams {
  search?: string;
  estado?: estado_simple | ""; // Permitir string vacío para "Todos"
  docenteIds?: string[]; // Un array de IDs de docentes
}

// Interfaz para la respuesta paginada completa de la API
export interface PaginatedCoursesResponse
  extends PaginatedResponse<CursoConDetalles> {}

export const findCourses = async (
  params: FindCoursesParams
): Promise<PaginatedCoursesResponse> => {
  try {
    // Makes a GET request to /api/courses/all (or your configured base URL + /cursos)
    // Axios automatically converts the 'params' object into query parameters
    const response = await apiClient.get("/courses/all", {
      params: params,
      // Ensure Axios handles array params correctly if you add them later
      paramsSerializer: {
        indexes: null,
      },
    });
    // Returns the data part of the Axios response, which should match PaginatedCoursesResponse
    return response.data;
  } catch (err: any) {
    // Rethrow the error so the component's catch block can handle it
    console.error("Error fetching courses:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al buscar los cursos.");
  }
};

export const findDocentesParaFiltro = async (): Promise<
  DocenteParaFiltro[]
> => {
  try {
    // Endpoint que devuelve solo los usuarios con rol 'Docente'
    const response = await apiClient.get("/users/teachers");

    // Mapeamos por si la API devuelve más campos de los que necesitamos
    const docentes = response.data.map((user: any) => ({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
    }));
    return docentes;
  } catch (err: any) {
    console.error(
      "Error fetching docentes:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al buscar los docentes.");
  }
};

// ... (Your other course service functions like createCourse, updateCourse, deleteCourse will go here)
