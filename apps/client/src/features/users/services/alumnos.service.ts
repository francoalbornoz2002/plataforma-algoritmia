import apiClient from "../../../lib/axios";
// Usamos el tipo que ya existe
import type {
  CursoParaEditar,
  DificultadAlumnoDetallada,
  estado_simple,
  MisionConEstado,
  ProgresoAlumno,
} from "../../../types";

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
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tus cursos.");
  }
};

/**
 * Inscribe al alumno actual en un curso usando la contraseña
 */
export const joinCourse = async (
  idCurso: string,
  contrasenaAcceso: string
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
  idCurso: string
): Promise<ProgresoAlumno> => {
  try {
    const response = await apiClient.get("/alumnos/my/progress", {
      params: { idCurso }, // Envía ?idCurso=...
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student progress:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tu progreso.");
  }
};

export const getMyDifficulties = async (
  idCurso: string
): Promise<DificultadAlumnoDetallada[]> => {
  try {
    const response = await apiClient.get("/alumnos/my/difficulties", {
      params: { idCurso }, // Envía ?idCurso=...
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulties:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tus dificultades.");
  }
};

/**
 * Obtiene el estado de todas las misiones (completadas/pendientes)
 * para el alumno actual en el curso seleccionado.
 */
export const getMyMissions = async (
  idCurso: string
): Promise<MisionConEstado[]> => {
  try {
    const response = await apiClient.get("/alumnos/my/missions", {
      params: { idCurso },
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student missions:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tus misiones.");
  }
};
