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
  AlumnoActivo,
  AlumnoElegible,
  DocenteBasico,
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
    const response = await apiClient.get("/cursos", {
      params: params,
      paramsSerializer: {
        indexes: null, // Para que axios maneje bien los arrays
      },
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error al obtener los cursos:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al buscar los cursos.");
  }
};

/* Busca todos los docentes activos para los filtros */
export const findDocentesParaFiltro = async (): Promise<
  DocenteParaFiltro[]
> => {
  try {
    const response = await apiClient.get("/usuarios/docentes");
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
    const response = await apiClient.get(`/cursos/${id}`);
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
    const response = await apiClient.post("/cursos", formData, {
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
    const response = await apiClient.patch(`/cursos/${id}`, formData, {
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
    await apiClient.delete(`/cursos/${id}`);
  } catch (err: any) {
    console.error(
      `Error deleting course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al dar de baja el curso.");
  }
};

/**
 * Da de baja a un alumno de un curso (Docente)
 */
export const removeStudentFromCourse = async (
  idCurso: string,
  idAlumno: string,
): Promise<void> => {
  try {
    await apiClient.delete(`/cursos/${idCurso}/alumnos/${idAlumno}/baja`);
  } catch (err: any) {
    console.error(
      "Error removing student from course:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al dar de baja al alumno.");
  }
};

/* Finaliza un curso (Cierre de ciclo) */
export const finalizeCourse = async (id: string): Promise<void> => {
  try {
    await apiClient.patch(`/cursos/${id}/finalizar`);
  } catch (err: any) {
    console.error(
      `Error finalizing course ${id}:`,
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al finalizar el curso.");
  }
};

/**
 * Inscribe al alumno actual en un curso usando la contraseña
 */
export const joinCourse = async (
  idCurso: string,
  contrasenaAcceso: string,
): Promise<any> => {
  try {
    const response = await apiClient.post(`/cursos/${idCurso}/inscribirse`, {
      contrasenaAcceso,
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error al inscribirse al curso:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al inscribirse al curso.");
  }
};

// --- Función para obtener estadísticas del dashboard de ALUMNO ---
export const getStudentDashboardStats = async (idCurso: string) => {
  try {
    const response = await apiClient.get(
      `/cursos/${idCurso}/student-dashboard`,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error fetching student dashboard stats:", err);
    throw (
      err.response?.data ||
      new Error("Error al obtener estadísticas del alumno.")
    );
  }
};

/**
 * Obtiene la lista de alumnos activos de un curso (para filtros).
 * @param idCurso - El ID del curso.
 */
export const findActiveAlumnos = async (
  idCurso: string,
): Promise<AlumnoActivo[]> => {
  try {
    const response = await apiClient.get(`/cursos/${idCurso}/alumnos-activos`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching active alumnos:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener la lista de alumnos activos.")
    );
  }
};

/**
 * Obtiene la lista de docentes activos de un curso (para filtros)
 */
export const findActiveDocentes = async (
  idCurso: string,
): Promise<DocenteBasico[]> => {
  try {
    const response = await apiClient.get(`/cursos/${idCurso}/docentes-activos`);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching active docentes:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener los docentes.");
  }
};

/**
 * Obtiene la lista de alumnos de un curso que son elegibles para una sesión de refuerzo
 * (es decir, que tienen al menos una dificultad registrada).
 * @param idCurso - El ID del curso.
 */
export const findEligibleAlumnos = async (
  idCurso: string,
): Promise<AlumnoElegible[]> => {
  try {
    // NOTA: Asumimos que este endpoint existe para optimizar la carga.
    const response = await apiClient.get(
      `/cursos/${idCurso}/alumnos-aptos-refuerzo`,
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching eligible alumnos:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener la lista de alumnos elegibles.")
    );
  }
};
