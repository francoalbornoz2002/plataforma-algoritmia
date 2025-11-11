import apiClient from "../../../lib/axios";
// Usamos el tipo que ya existe
import type {
  Consulta,
  CursoParaEditar,
  DificultadAlumnoDetallada,
  DificultadesCurso,
  estado_simple,
  FindConsultasParams,
  FindStudentDifficultiesParams,
  FindStudentProgressParams,
  MisionConEstado,
  PaginatedConsultasDocenteResponse,
  PaginatedConsultasResponse,
  PaginatedStudentDifficultiesResponse,
  PaginatedStudentProgressResponse,
  ProgresoCurso,
} from "../../../types";
import type { CreateRespuestaFormValues } from "../../consultas/validations/createRespuesta.schema";

// Usamos la misma 'shape' que el servicio de alumnos
export interface AsignacionConCurso {
  idDocente: string;
  idCurso: string;
  estado: estado_simple;
  curso: CursoParaEditar; // <-- Usamos el tipo acordado
}

/**
 * Busca todos los cursos (activos e inactivos) de un docente
 */
export const findMyCourses = async (): Promise<AsignacionConCurso[]> => {
  try {
    const response = await apiClient.get("/docentes/my/courses");
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching teacher's courses:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al obtener tus cursos.");
  }
};

/**
 * Obtiene el Resumen (KPIs) de un curso específico
 */
export const getCourseOverview = async (
  idCurso: string
): Promise<ProgresoCurso> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/progress-overview`
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching course overview:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data || new Error("Error al obtener el resumen del curso.")
    );
  }
};

/**
 * Obtiene la lista paginada y filtrada de alumnos y su progreso
 */
export const getStudentProgressList = async (
  idCurso: string,
  params: FindStudentProgressParams
): Promise<PaginatedStudentProgressResponse> => {
  try {
    // 1. Creamos una copia tipada de los parámetros
    const cleanedParams: FindStudentProgressParams = { ...params };

    // 2. Iteramos sobre las claves de forma segura para TypeScript
    (
      Object.keys(cleanedParams) as Array<keyof FindStudentProgressParams>
    ).forEach((key) => {
      // Comprobamos si el valor de esa clave es un string vacío
      if (cleanedParams[key] === "") {
        // Si lo es, eliminamos esa clave del objeto
        delete cleanedParams[key];
      }
    });

    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/progress-students`,
      {
        params: cleanedParams, // Axios convierte esto en query params (ej: ?page=1&limit=10)
      }
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student progress list:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener el progreso de los alumnos.")
    );
  }
};

/**
 * Obtiene el Resumen (KPIs) de Dificultades de un curso
 */
export const getCourseDifficultiesOverview = async (
  idCurso: string
): Promise<DificultadesCurso> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/difficulties-overview`
    );
    // Convertimos los Decimal a Number si es necesario
    response.data.promDificultades = parseFloat(response.data.promDificultades);
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching difficulties overview:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener el resumen de dificultades.")
    );
  }
};

/**
 * Obtiene la lista paginada de alumnos para la DataGrid de Dificultades
 */
export const getStudentDifficultyList = async (
  idCurso: string,
  params: FindStudentDifficultiesParams
): Promise<PaginatedStudentDifficultiesResponse> => {
  try {
    // Limpiamos los params vacíos (como hicimos en ProgressPage)
    const cleanedParams = { ...params };
    (
      Object.keys(cleanedParams) as Array<keyof FindStudentDifficultiesParams>
    ).forEach((key) => {
      if (cleanedParams[key] === "") {
        delete cleanedParams[key];
      }
    });

    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/difficulties-list`,
      {
        params: cleanedParams,
      }
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulty list:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data || new Error("Error al obtener la lista de alumnos.")
    );
  }
};

/**
 * Obtiene el detalle de dificultades de UN alumno (para el modal)
 */
export const getStudentDifficultiesDetail = async (
  idCurso: string,
  idAlumno: string
): Promise<DificultadAlumnoDetallada[]> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/student/${idAlumno}/difficulties`
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student difficulties detail:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data || new Error("Error al obtener el detalle del alumno.")
    );
  }
};

/**
 * Obtiene el estado de todas las misiones (completadas/pendientes)
 * de UN alumno específico para el docente.
 */
export const getStudentMissions = async (
  idCurso: string,
  idAlumno: string
): Promise<MisionConEstado[]> => {
  try {
    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/student/${idAlumno}/missions`
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching student missions for teacher:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener las misiones del alumno.")
    );
  }
};

export const findConsultas = async (
  idCurso: string,
  params: FindConsultasParams
): Promise<PaginatedConsultasDocenteResponse> => {
  try {
    // Limpiamos params (para filtros vacíos)
    const cleanedParams: Partial<FindConsultasParams> = { ...params };
    (Object.keys(cleanedParams) as Array<keyof FindConsultasParams>).forEach(
      (key) => {
        if (cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      }
    );

    const response = await apiClient.get(
      `/docentes/my/courses/${idCurso}/consults`, // <-- Usamos tu ruta 'my'
      {
        params: cleanedParams,
      }
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error fetching course consults:",
      err.response?.data || err.message
    );
    throw (
      err.response?.data ||
      new Error("Error al obtener las consultas del curso.")
    );
  }
};

/**
 * Envía una respuesta a una consulta (Docente)
 */
export const createRespuesta = async (
  idConsulta: string,
  data: CreateRespuestaFormValues
): Promise<Consulta> => {
  try {
    const response = await apiClient.post(
      `/docentes/my/consults/${idConsulta}/respond`,
      data
    );
    return response.data;
  } catch (err: any) {
    console.error(
      "Error creating consult response:",
      err.response?.data || err.message
    );
    throw err.response?.data || new Error("Error al enviar la respuesta.");
  }
};
