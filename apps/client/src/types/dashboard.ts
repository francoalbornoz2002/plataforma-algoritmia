import type { ClaseConsulta } from "./claseConsulta";
import type { Mision } from "./mision";
import { estado_consulta } from "./enums";
import type { Institucion } from "./institucion";

export interface CourseDashboardData {
  progresoPct: number;
  dificultadMasDetectada: string | null;
  consultas: { total: number; pendientes: number };
  sesiones: { total: number; pendientes: number };
  nextClass: ClaseConsulta | null;
  consultasPorEstado: { label: string; value: number }[];
  sesionesPorEstado: { label: string; value: number }[];
  sesionesPorOrigen: { sistema: number; docente: number };
  evolucionProgreso: { fecha: string | Date; progreso: number }[];
  dificultadesGraficos: {
    porTema: { label: string; value: number }[];
    porDificultad: { label: string; value: number }[];
    porGrado: { label: string; value: number; color: string }[];
  };
}

export interface StudentDashboardStats {
  misiones: { hoy: number; semana: number };
  progresoPct: number;
  misionMasDificil: {
    mision: Mision;
    intentos: number;
    promedioHistorial: number;
  } | null;
  sesionPendiente: {
    id: string;
    fechaHoraLimite: string;
    dificultad: { nombre: string };
  } | null;
  proximaClase: {
    id: string;
    fechaInicio: string;
    fechaFin: string;
    modalidad: string;
    nombre: string;
  } | null;
  dificultades: {
    activas: number;
    distribucion: { label: string; value: number }[];
    ultimaAlta: { nombre: string; gradoActual: string } | null;
  };
  consultas: {
    total: number;
    distribucion: { label: string; value: number }[];
    recientes: {
      id: string;
      titulo: string;
      estado: string;
      updatedAt: string;
    }[];
    ultimaRealizada: {
      id: string;
      titulo: string;
      descripcion: string;
      estado: estado_consulta;
      createdAt: string;
    } | null;
  };
  sesiones: {
    total: number;
    distribucion: { label: string; value: number }[];
    ultimoResultado: {
      dificultadNombre: string;
      pctAciertos: number;
      gradoAnterior: string;
      gradoNuevo: string;
      nroSesion: number;
    } | null;
  };
  cantidadAlumnosInscriptos: number;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    docentes: number;
    alumnos: number;
  };
  courses: {
    total: number;
    active: number;
    inactive: number;
    finalized: number;
  };
  classes: {
    week: { total: number; pctRealizadas: number; pctCanceladas: number };
    month: { total: number; pctRealizadas: number; pctCanceladas: number };
  };
  sessions: {
    week: { total: number; pctCompletadas: number; pctPendientes: number };
    month: { total: number; pctCompletadas: number; pctPendientes: number };
  };
  institution: Institucion | null;
}
