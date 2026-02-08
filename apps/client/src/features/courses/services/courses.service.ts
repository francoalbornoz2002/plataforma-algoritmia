import apiClient from "../../../lib/axios";
import type {
  DocenteParaFiltro,
  BaseFilterParams,
  estado_simple,
  CursoConDetalles,
  PaginatedResponse,
  Curso,
  CursoParaEditar,
  CreateCourseData,
  UpdateCourseData,
} from "../../../types";

// Interfaz para los parámetros de búsqueda
export interface FindCoursesParams extends BaseFilterParams {
  search?: string;
  estado?: estado_simple | ""; // Permitir string vacío para "Todos"
  docenteIds?: string[]; // Un array de IDs de docentes
}

// Interfaz para la respuesta paginada completa de la API
export interface PaginatedCoursesResponse
  extends PaginatedResponse<CursoConDetalles> {}

/* Busca una lista paginada de cursos (para la página principal) */
export const findCourses = async (
  params: FindCoursesParams,
): Promise<PaginatedCoursesResponse> => {
  try {
    const response = await apiClient.get("/courses/all", {
      params: params,
      paramsSerializer: {
        indexes: null, // Para que axios maneje bien los arrays
      },
    });
    return response.data;
  } catch (err: any) {
    console.error("Error fetching courses:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al buscar los cursos.");
  }
};

/* Busca todos los docentes activos para los filtros */
export const findDocentesParaFiltro = async (): Promise<
  DocenteParaFiltro[]
> => {
  try {
    const response = await apiClient.get("/users/teachers");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching docentes:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al buscar los docentes.");
  }
};

// --- FUNCIONES CRUD ---

/* Busca un único curso por su ID con TODOS los datos para edición.
(El endpoint devuelve el curso con 'docentes' y 'diasClase') */
export const findCourseById = async (id: string): Promise<CursoParaEditar> => {
  try {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  } catch (err: any) {
    console.error(
      `Error fetching course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al buscar el curso.");
  }
};

/* Crea un nuevo curso. Se usa FormData para incluir la imagen. */
export const createCourse = async (
  data: CreateCourseData,
  imagen: File | null,
): Promise<Curso> => {
  const formData = new FormData();

  // 1. Añadimos los datos JSON (el backend los parsea)
  formData.append("nombre", data.nombre);
  formData.append("descripcion", data.descripcion);
  formData.append("contrasenaAcceso", data.contrasenaAcceso);
  formData.append("modalidadPreferencial", data.modalidadPreferencial);
  formData.append("docenteIds", JSON.stringify(data.docenteIds));
  formData.append("diasClase", JSON.stringify(data.diasClase));

  // 2. Añadimos el archivo de imagen (si existe)
  if (imagen) {
    formData.append("imagen", imagen);
  }

  try {
    const response = await apiClient.post("/courses/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error al crear el curso:", error);
    throw error;
  }
};

/* Actualiza un curso existente por su ID. Usamos FormData para incluir la imagen. */
export const updateCourse = async (
  id: string,
  data: UpdateCourseData,
  imagen: File | null,
): Promise<Curso> => {
  const formData = new FormData();

  // Añadimos los campos que SÍ están presentes
  if (data.nombre) formData.append("nombre", data.nombre);
  if (data.descripcion) formData.append("descripcion", data.descripcion);
  if (data.contrasenaAcceso)
    formData.append("contrasenaAcceso", data.contrasenaAcceso);
  if (data.modalidadPreferencial)
    formData.append("modalidadPreferencial", data.modalidadPreferencial);
  if (data.docenteIds)
    formData.append("docenteIds", JSON.stringify(data.docenteIds));
  if (data.diasClase)
    formData.append("diasClase", JSON.stringify(data.diasClase));

  // Añadimos el archivo (si existe)
  if (imagen) {
    formData.append("imagen", imagen);
  }

  try {
    const response = await apiClient.patch(`/courses/edit/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err: any) {
    console.error(
      `Error updating course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al actualizar el curso.");
  }
};

/* Da de baja un curso por su ID. */
export const deleteCourse = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/courses/delete/${id}`);
  } catch (err: any) {
    console.error(
      `Error deleting course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al dar de baja el curso.");
  }
};

/* Finaliza un curso (Cierre de ciclo) */
export const finalizeCourse = async (id: string): Promise<void> => {
  try {
    await apiClient.patch(`/courses/finalize/${id}`);
  } catch (err: any) {
    console.error(
      `Error finalizing course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al finalizar el curso.");
  }
};
