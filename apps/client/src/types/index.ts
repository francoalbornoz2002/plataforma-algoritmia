import type {
  ActivityRange,
  AttemptsRange,
  ProgressRange,
  StarsRange,
} from "./progress-filters";

export type Genero = "Masculino" | "Femenino" | "Otro";

export enum roles {
  Administrador = "Administrador",
  Docente = "Docente",
  Alumno = "Alumno",
}

export enum estado_simple {
  Activo = "Activo",
  Inactivo = "Inactivo",
}

export enum modalidad {
  Presencial = "Presencial",
  Virtual = "Virtual",
}

export enum dias_semana {
  Lunes = "Lunes",
  Martes = "Martes",
  Miercoles = "Miercoles",
  Jueves = "Jueves",
  Viernes = "Viernes",
  Sabado = "Sabado",
}

export enum temas {
  Secuencia = "Secuencia",
  Logica = "Logica",
  Estructuras = "Estructuras",
  Variables = "Variables",
  Procedimientos = "Procedimientos",
  Ninguno = "Ninguno",
}

export enum grado_dificultad {
  Ninguno = "Ninguno",
  Bajo = "Bajo",
  Medio = "Medio",
  Alto = "Alto",
}

export enum dificultad_mision {
  Facil = "Facil",
  Medio = "Medio",
  Dificil = "Dificil",
}

export enum estado_consulta {
  Pendiente = "Pendiente",
  A_revisar = "A revisar",
  Revisada = "Revisada",
  Resuelta = "Resuelta",
}

/* ---------------------- INTERFACES ---------------------- */

export interface MenuItemType {
  text: string;
  icon: React.ReactElement; // Para aceptar JSX como <DashboardIcon />
  path: string;
}

// ----- USUARIOS ----- //

// Interfaz principal para Usuario
// También representa CÓMO devuelve la API los datos del usuario
export interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  genero: Genero;
  email: string;
  rol: roles;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

// Tipo para CREAR un usuario. Omitimos los campos que maneja la BD
export type CreateUserData = Omit<
  UserData,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "edad"
> & {
  password?: string;
};

// Tipo para ACTUALIZAR un usuario: todos los campos de CreateUsuarioData opcionales,
// y EXCLUIMOS 'email'
export type UpdateUserData = Partial<Omit<CreateUserData, "email">>;

// ----- CURSOS ----- //

// La interfaz principal para Curso
export interface Curso {
  id: string;
  idProgreso: string; // O idProgresoCurso si renombraste
  idDificultadesCurso: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null; // Hacerlo opcional o nulable
  contrasenaAcceso: string; // El backend devuelve el hash, ¡no la muestres!
  modalidadPreferencial: modalidad;
  createdAt: string; // Las fechas llegan como strings ISO
  updatedAt: string;
  deletedAt?: string | null;
}

// Datos para CREAR.
// Omitimos campos generados y modalidadPreferencial (se setea por defecto en backend)
// La imagen se manejará por separado como un archivo.
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

// Información del docente para la Card de cursos (Un subconjunto del Usuario)
export interface DocenteBasico {
  id: string;
  nombre: string;
  apellido: string;
}

// Representa la fila de la tabla intermedia 'docente_curso'
// Incluye el objeto anidado 'docente' que pedimos en el 'include'
export interface DocenteCursoConDocente {
  // No necesitamos idDocente, idCurso, estado aquí si solo mostramos el nombre
  docente: DocenteBasico;
}

// La interfaz que representa CÓMO devuelve la API los datos del curso
// (Curso + docentes anidados + conteo de alumnos)
export interface CursoConDetalles extends Curso {
  docentes: DocenteCursoConDocente[]; // Array de la interfaz intermedia
  _count: {
    alumnos: number;
  };
}

export interface DocenteParaFiltro {
  id: string;
  nombre: string;
  apellido: string;
}

// Tipo para el sub-formulario de Días de Clase
// (Tendrá un ID temporal en el state del frontend)
export interface DiaClaseFormData {
  id: string | null;
  _tempId?: string; // Para 'key' en React
  dia: dias_semana;
  horaInicio: string; // Formato "HH:mm"
  horaFin: string; // Formato "HH:mm"
  modalidad: modalidad;
}

// Tipo que esperamos recibir del backend para PRE-POBLAR el form de edición
// (Extiende CursoConDetalles para incluir diasClase)
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

// Interfaz base para los parámetros de búsqueda y filtros
export interface BaseFilterParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

// Interfaz base para la respuesta paginada de la API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// --------------- PROGRESO --------------- //

// Para el Resumen/KPIs (coincide con el modelo ProgresoCurso de Prisma)
export interface ProgresoCurso {
  id: string;
  misionesCompletadas: number;
  totalEstrellas: number;
  totalExp: number;
  totalIntentos: number;
  pctMisionesCompletadas: number; // Prisma usa Decimal, TS lo trata como number
  promEstrellas: number;
  promIntentos: number;
  estado: estado_simple;
}

// Para la DataGrid (ProgresoAlumno + nombre)
export interface ProgresoAlumnoDetallado {
  id: string;
  idAlumno: string;
  cantMisionesCompletadas: number;
  totalEstrellas: number;
  totalExp: number;
  totalIntentos: number;
  pctMisionesCompletadas: number;
  promEstrellas: number;
  promIntentos: number;
  ultimaActividad: string | null; // Llega como string ISO
  estado: estado_simple;
  // Campos añadidos por el servicio:
  nombre: string;
  apellido: string;
}

export type ProgresoAlumno = Omit<
  ProgresoAlumnoDetallado,
  "nombre" | "apellido"
>;

// Para los parámetros del servicio de la DataGrid
export interface FindStudentProgressParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  progressRange?: ProgressRange | "";
  starsRange?: StarsRange | "";
  attemptsRange?: AttemptsRange | "";
  activityRange?: ActivityRange | "";
}

// Para la respuesta paginada de la DataGrid
export interface PaginatedStudentProgressResponse
  extends PaginatedResponse<ProgresoAlumnoDetallado> {}

// ----- DIFICULTADES ----- //

// 1. Para el Resumen/KPIs de Dificultades (coincide con DificultadesCurso)
export interface DificultadesCurso {
  id: string;
  temaModa: temas;
  idDificultadModa: string | null;
  promDificultades: number;
  promGrado: grado_dificultad;
  estado: estado_simple;
  dificultadModa?: {
    // El include que añadimos
    nombre: string;
  };
}

// 2. Para la DataGrid de Dificultades del Docente
export interface AlumnoDificultadResumen {
  id: string; // id del ALUMNO
  nombre: string;
  apellido: string;
  totalDificultades: number;
  gradoAlto: number;
  gradoMedio: number;
  gradoBajo: number;
  gradoNinguno: number;
}

// 3. Para los parámetros del servicio de la DataGrid
export interface FindStudentDifficultiesParams extends BaseFilterParams {
  search?: string;
  tema?: temas | "";
  dificultadId?: string | "";
  grado?: grado_dificultad | "";
}

// 4. Para la respuesta paginada de la DataGrid
export interface PaginatedStudentDifficultiesResponse
  extends PaginatedResponse<AlumnoDificultadResumen> {}

export interface DificultadAlumnoDetallada {
  id: string;
  nombre: string;
  descripcion: string;
  tema: temas;
  grado: grado_dificultad; // El grado del alumno
}

// ---------- MISIONES ---------- //
// 1. Tipo para la Misión Maestra (de la tabla 'misiones')
export interface Mision {
  id: string;
  nombre: string;
  descripcion: string;
  dificultadMision: dificultad_mision;
  // (No incluimos 'misionesCompletadas' que venía de Prisma)
}

// 2. Tipo para la Misión Completada (de la tabla 'mision_completada')
export interface MisionCompletada {
  idMision: string;
  idProgreso: string;
  estrellas: number;
  exp: number;
  intentos: number;
  fechaCompletado: string | null; // Llega como string ISO
}

// 3. Tipo para la respuesta "fusionada" del backend
export interface MisionConEstado {
  mision: Mision;
  completada: MisionCompletada | null; // null si está pendiente
}

// ---------- INSTITUCIÓN ---------- //
export interface Provincia {
  id: number;
  provincia: string;
}

export interface Localidad {
  id: number;
  idProvincia: number;
  localidad: string;
}

export interface Institucion {
  id: string;
  idLocalidad: number;
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
  localidad: {
    id: number;
    idProvincia: number;
    localidad: string;
    provincia: {
      id: number;
      provincia: string;
    };
  };
}
// ---------- Auditoría ---------- //
export interface LogAuditoria {
  id: string;
  tablaAfectada: string;
  idFilaAfectada: string;
  operacion: string;
  idUsuarioModifico: string | null;
  fechaHora: string;
  valoresAnteriores: any;
  valoresNuevos: any;
  // El 'usuarioModifico' que incluimos en el backend
  usuarioModifico: {
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

// 2. Para los parámetros del servicio (los filtros)
export interface FindLogsParams extends BaseFilterParams {
  fechaDesde?: string;
  fechaHasta?: string;
  tablaAfectada?: string;
  operacion?: string;
  search?: string;
}

// 3. Para la respuesta paginada de la API
export interface PaginatedLogsResponse
  extends PaginatedResponse<LogAuditoria> {}

//

export interface FindConsultasParams extends BaseFilterParams {
  tema?: temas | "";
  estado?: estado_consulta | "";
  search?: string;
}

// 1. TIPO CONSULTA (Alumno)
export interface Consulta {
  id: string;
  idAlumno: string;
  idCurso: string;
  titulo: string;
  tema: temas;
  descripcion: string;
  fechaConsulta: string;
  estado: estado_consulta;
  valoracionAlumno: number | null;
  comentarioValoracion: string | null;
  deletedAt: string | null;

  // La respuesta (si existe)
  respuestaConsulta: {
    id: string;
    descripcion: string;
    fechaRespuesta: string;
    docente: {
      nombre: string;
      apellido: string;
    };
  } | null;
}

// 2. TIPO PAGINADO (Para el Alumno)
export interface PaginatedConsultasResponse
  extends PaginatedResponse<Consulta> {}

// 3. TIPO EXTENDIDO (Para el Docente)
export interface ConsultaDocente extends Consulta {
  // Hereda todo de 'Consulta' y añade 'alumno'
  alumno: {
    nombre: string;
    apellido: string;
  };
}

// 4. TIPO PAGINADO (Para el Docente)
export interface PaginatedConsultasDocenteResponse
  extends PaginatedResponse<ConsultaDocente> {}
