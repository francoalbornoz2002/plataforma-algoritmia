import apiClient from "../../../lib/axios";
// Usamos el tipo que ya existe
import type {
  Consulta,
  CursoParaEditar,
  DificultadAlumnoDetallada,
  DocenteBasico,
  estado_simple,
  FindConsultasParams,
  MisionConEstado,
  PaginatedConsultasResponse,
  PaginatedConsultasDocenteResponse, // Usamos este tipo porque incluye datos del alumno autor
  ProgresoAlumno,
} from "../../../types";
import type {
  CreateConsultaFormValues,
  UpdateConsultaFormValues,
} from "../../consultas/validations/consulta.schema";
import type { ValorarConsultaFormValues } from "../../consultas/validations/valorarConsulta.schema";

// 1. Definimos el tipo de dato que devuelve 'findMyCourses'
export interface InscripcionConCurso {
  idAlumno: string;
  idCurso: string;
  estado: estado_simple;
  curso: CursoParaEditar; // <-- Usamos el tipo acordado
}

/**
 * Busca todos los cursos (activos e inactivos) de un alumno
 */
export const findMyCourses = async (): Promise<InscripcionConCurso[]> => {
  try {
    const response = await apiClient.get("/alumnos/my/courses");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student's courses:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tus cursos.");
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
    // Asumo que tu endpoint de 'join' está en el AlumnosController
    // y que el 'idCurso' va en el body (si va en la URL, hay que cambiarlo)
    const response = await apiClient.post(`/alumnos/my/join-course`, {
      idCurso,
      contrasenaAcceso,
    });
    return response.data;
  } catch (err: any) {
    console.error("Error joining course:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al unirse al curso.");
  }
};

export const getMyProgress = async (
  idCurso: string,
): Promise<ProgresoAlumno> => {
  try {
    const response = await apiClient.get("/alumnos/my/progress", {
      params: { idCurso }, // Envía ?idCurso=...
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student progress:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tu progreso.");
  }
};

export const getMyDifficulties = async (
  idCurso: string,
): Promise<DificultadAlumnoDetallada[]> => {
  try {
    const response = await apiClient.get("/alumnos/my/difficulties", {
      params: { idCurso }, // Envía ?idCurso=...
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulties:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tus dificultades.");
  }
};

/**
 * Obtiene el estado de todas las misiones (completadas/pendientes)
 * para el alumno actual en el curso seleccionado.
 */
export const getMyMissions = async (
  idCurso: string,
): Promise<MisionConEstado[]> => {
  try {
    const response = await apiClient.get("/alumnos/my/missions", {
      params: { idCurso },
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student missions:",
      err.response?.data || err.message,
    );
    throw err.response?.data || new Error("Error al obtener tus misiones.");
  }
};

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
      `/alumnos/my/courses/${idCurso}/consults`,
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

/**
 * Obtiene la lista paginada de consultas PÚBLICAS del curso
 */
export const getPublicConsultas = async (
  idCurso: string,
  params: FindConsultasParams,
): Promise<PaginatedConsultasDocenteResponse> => {
  try {
    const cleanedParams: Partial<FindConsultasParams> = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindConsultasParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      },
    );

    const response = await apiClient.get(
      `/alumnos/course/${idCurso}/consultas-publicas`,
      {
        params: cleanedParams,
      },
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching public consults:",
      err.response?.data || err.message,
    );
    throw (
      err.response?.data || new Error("Error al obtener consultas públicas.")
    );
  }
};

/**
 * Crea una nueva consulta (Alumno)
 */
export const createConsulta = async (
  idCurso: string,
  data: CreateConsultaFormValues,
): Promise<Consulta> => {
  try {
    // El backend DTO espera 'fechaConsulta', la añadimos
    const payload = {
      ...data,
      fechaConsulta: new Date().toISOString(), // Añadimos la fecha actual
    };

    const response = await apiClient.post(
      `/alumnos/my/courses/${idCurso}/consults/create`,
      payload,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error creating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al crear la consulta.");
  }
};

/**
 * Edita una consulta existente (Alumno)
 */
export const updateConsulta = async (
  idConsulta: string,
  data: UpdateConsultaFormValues, // Usamos el DTO de Update
): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "edit"
    const response = await apiClient.patch(
      `/alumnos/my/consults/edit/${idConsulta}`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error updating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al actualizar la consulta.");
  }
};

// --- ¡NUEVA FUNCIÓN DE BORRADO! ---
/**
 * Borra (soft delete) una consulta (Alumno)
 */
export const deleteConsulta = async (idConsulta: string): Promise<Consulta> => {
  try {
    // Apuntamos a la nueva ruta "delete"
    const response = await apiClient.delete(
      `/alumnos/my/consults/delete/${idConsulta}`,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error deleting consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al borrar la consulta.");
  }
};

/**
 * Valora una respuesta (Alumno)
 */
export const valorarConsulta = async (
  idConsulta: string,
  data: ValorarConsultaFormValues,
): Promise<Consulta> => {
  try {
    const response = await apiClient.patch(
      `/alumnos/my/consults/${idConsulta}/valorar`,
      data,
    );
    return response.data;
  } catch (err: any) {
    console.error("Error rating consult:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al valorar la consulta.");
  }
};

/**
 * Obtiene la lista de alumnos activos de un curso (para filtros).
 * @param idCurso - El ID del curso.
 */
export const findActiveAlumnos = async (
  idCurso: string,
): Promise<DocenteBasico[]> => {
  try {
    // Asumimos que existe un endpoint para esto, similar a active-docentes.
    const response = await apiClient.get(
      `/alumnos/my/courses/${idCurso}/active-alumnos`,
    );
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
 * Obtiene la lista de alumnos de un curso que son elegibles para una sesión de refuerzo
 * (es decir, que tienen al menos una dificultad registrada).
 * @param idCurso - El ID del curso.
 */
export const findEligibleAlumnos = async (
  idCurso: string,
): Promise<DocenteBasico[]> => {
  try {
    // NOTA: Asumimos que este endpoint existe para optimizar la carga.
    const response = await apiClient.get(
      `/alumnos/courses/${idCurso}/elegibles-refuerzo`,
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

/**
 * Obtiene las dificultades detalladas para un alumno específico en un curso.
 * @param idCurso - El ID del curso.
 * @param idAlumno - El ID del alumno.
 */
export const getStudentDifficulties = async (
  idCurso: string,
  idAlumno: string,
): Promise<DificultadAlumnoDetallada[]> => {
  // Reutiliza el endpoint existente `getMyDifficulties` pero para un alumno específico
  const response = await apiClient.get(`/alumnos/${idAlumno}/difficulties`, {
    params: { idCurso },
  });
  return response.data;
};
