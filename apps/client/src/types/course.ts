import { modalidad, estado_simple, dias_semana } from "./enums";
import type { DocenteBasico, DocenteParaFiltro } from "./user";

// La interfaz principal para Curso
export interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null; // Hacerlo opcional o nulable
  contrasenaAcceso: string; // El backend devuelve el hash, ¡no la muestres!
  modalidadPreferencial: modalidad;
  estado: estado_simple;
  createdAt: string; // Las fechas llegan como strings ISO
  updatedAt: string;
  deletedAt?: string | null;
}

// Datos para CREAR.
export type CreateCourseData = Pick<
  Curso,
  "nombre" | "descripcion" | "contrasenaAcceso" | "modalidadPreferencial"
> & {
  docenteIds: string[]; // Array de IDs
  diasClase: {
    id: string | null; // <-- Enviamos el ID real (o null)
    dia: dias_semana;
    horaInicio: string;
    horaFin: string;
    modalidad: modalidad;
  }[];
};

// Datos para ACTUALIZAR
export type UpdateCourseData = Partial<CreateCourseData>;

// Representa la fila de la tabla intermedia 'docente_curso'
export interface DocenteCursoConDocente {
  docente: DocenteBasico;
}

// La interfaz que representa CÓMO devuelve la API los datos del curso
export interface CursoConDetalles extends Curso {
  docentes: DocenteCursoConDocente[]; // Array de la interfaz intermedia
  _count: {
    alumnos: number;
  };
  progresoCurso?: { estado: estado_simple };
}

// Tipo para el sub-formulario de Días de Clase
export interface DiaClaseFormData {
  id: string | null;
  _tempId?: string; // Para 'key' en React
  dia: dias_semana;
  horaInicio: string; // Formato "HH:mm"
  horaFin: string; // Formato "HH:mm"
  modalidad: modalidad;
}

// Tipo que esperamos recibir del backend para PRE-POBLAR el form de edición
export type CursoParaEditar = Omit<CursoConDetalles, "docentes"> & {
  docentes: DocenteParaFiltro[]; // El array plano que envía 'findOne'
  diasClase: {
    id: string; // El ID real del DiaClase
    dia: dias_semana;
    horaInicio: string;
    horaFin: string;
    modalidad: modalidad;
  }[];
};
