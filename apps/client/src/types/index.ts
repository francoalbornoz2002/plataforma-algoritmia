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
  Finalizado = "Finalizado",
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
  A_revisar = "A_revisar",
  Revisada = "Revisada",
  Resuelta = "Resuelta",
  No_resuelta = "No_resuelta",
}

export enum estado_clase_consulta {
  Programada = "Programada",
  Realizada = "Realizada",
  No_realizada = "No_realizada",
  Cancelada = "Cancelada",
  Pendiente_Asignacion = "Pendiente_Asignacion",
  En_curso = "En_curso",
  Finalizada = "Finalizada",
}

export enum estado_sesion {
  Pendiente = "Pendiente",
  Cancelada = "Cancelada",
  Completada = "Completada",
  Incompleta = "Incompleta",
  No_realizada = "No_realizada",
}

export enum fuente_cambio_dificultad {
  VIDEOJUEGO = "VIDEOJUEGO",
  SESION_REFUERZO = "SESION_REFUERZO",
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
  fotoPerfilUrl?: string | null;
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
  estado: estado_simple;
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
  progresoCurso?: { estado: estado_simple };
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
  misionesCompletadas?: MisionCompletada[];
  misionesEspeciales?: MisionEspecial[];
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

export interface DificultadSimple {
  id: string;
  nombre: string;
}
export interface DificultadAlumnoDetallada extends DificultadSimple {
  descripcion: string;
  tema: temas;
  grado: grado_dificultad; // El grado del alumno
}

// Para el filtrado de dificultades por tema en formularios
export interface DificultadConTema extends DificultadSimple {
  tema: temas;
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
  mision: Mision;
}

// 3. Tipo para la respuesta "fusionada" del backend
export interface MisionConEstado {
  mision: Mision;
  completada: MisionCompletada | null; // null si está pendiente
}

// 4. Tipo para Misión Especial (NUEVO)
export interface MisionEspecial {
  id: string; // UUID
  idProgreso: string;
  nombre: string;
  descripcion: string;
  estrellas: number;
  exp: number;
  intentos: number;
  fechaCompletado: string;
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
  logoUrl?: string | null;
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

// ---------- PREGUNTAS ---------- //

// 1. Opción de Respuesta
export interface OpcionRespuesta {
  id: string;
  textoOpcion: string;
  esCorrecta: boolean;
}

// 2. Pregunta (como la devuelve la API en `findAll`)
export interface PreguntaConDetalles {
  id: string;
  enunciado: string;
  gradoDificultad: grado_dificultad;
  idDificultad: string;
  idDocente: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relaciones incluidas
  opcionesRespuesta: OpcionRespuesta[];
  dificultad: {
    nombre: string;
    tema: temas;
  };
  docenteCreador: {
    nombre: string;
    apellido: string;
  } | null;
}

// 3. Para crear una pregunta
export type CreatePreguntaData = {
  enunciado: string;
  idDificultad: string;
  gradoDificultad: grado_dificultad;
  opcionesRespuesta: Omit<OpcionRespuesta, "id">[];
};

// 4. Para actualizar una pregunta
export type UpdatePreguntaData = Partial<CreatePreguntaData>;

// 5. Para los filtros de búsqueda
export interface FindPreguntasParams extends BaseFilterParams {
  search?: string;
  tema?: temas | "";
  idDificultad?: string;
  gradoDificultad?: grado_dificultad | "";
  tipo?: "sistema" | "docente" | "";
}

// 6. Para la respuesta paginada
export interface PaginatedPreguntasResponse {
  data: PreguntaConDetalles[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// 7. Para buscar preguntas de sistema para una sesión
export interface FindSystemPreguntasParams {
  idDificultad: string;
  gradoDificultad: grado_dificultad;
}

// 4. TIPO PAGINADO (Para el Docente)
export interface PaginatedConsultasDocenteResponse
  extends PaginatedResponse<ConsultaDocente> {}

// ---------- SESIONES DE REFUERZO ---------- //

// 1. Resultado de una sesión (básico)
export interface ResultadoSesion {
  id: string;
  idSesion: string;
  cantCorrectas: number;
  cantIncorrectas: number;
  pctAciertos: number | string; // Puede llegar como string (Decimal de Prisma) o number
  fechaCompletado: string;
  gradoAnterior: grado_dificultad;
  gradoNuevo: grado_dificultad;
  respuestasAlumno?: RespuestaAlumno[];
}

// NUEVO: Para la respuesta de un alumno a una pregunta específica
export interface RespuestaAlumno {
  idSesion: string;
  idPregunta: string;
  idOpcionElegida: string;
  esCorrecta: boolean;
}

// 2. Sesión de refuerzo para vistas de lista/resumen (lo que devuelve `findAll`)
export interface SesionRefuerzoResumen {
  id: string;
  idCurso: string;
  idAlumno: string;
  idDocente: string | null;
  idDificultad: string;
  nroSesion: number;
  gradoSesion: grado_dificultad;
  fechaHoraLimite: string;
  fechaInicioReal: string | null; // <-- Agregado
  tiempoLimite: number;
  estado: estado_sesion;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relaciones
  alumno: {
    id: string;
    nombre: string;
    apellido: string;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
  dificultad: {
    id: string;
    nombre: string;
  };
  resultadoSesion: ResultadoSesion | null;
}

// 3. Sesión de refuerzo con todos los detalles (lo que devuelve `findOne`)
export interface SesionRefuerzoConDetalles extends SesionRefuerzoResumen {
  curso: {
    id: string;
    nombre: string;
  };
  preguntas: {
    pregunta: PreguntaConDetalles;
  }[];
}

// 4. Para crear una sesión de refuerzo
export type CreateSesionRefuerzoData = {
  idAlumno: string;
  idDificultad: string;
  gradoSesion: grado_dificultad;
  fechaHoraLimite: Date | string;
  tiempoLimite: number; // en minutos
  preguntas: string[]; // array de IDs de preguntas
};

// 5. Para actualizar una sesión de refuerzo
export type UpdateSesionRefuerzoData = Partial<CreateSesionRefuerzoData>;

// 6. Para los filtros de búsqueda
export interface FindSesionesParams extends BaseFilterParams {
  nroSesion?: number;
  idAlumno?: string;
  idDocente?: string;
  idDificultad?: string;
  gradoSesion?: grado_dificultad | "";
  estado?: estado_sesion | "";
}

// 7. Para la respuesta paginada
export interface PaginatedSesionesResponse {
  data: SesionRefuerzoResumen[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 8. Para resolver una sesión (Payload)
export interface ResolverSesionPayload {
  respuestas: {
    idPregunta: string;
    idOpcionElegida: string;
  }[];
}

// 9. Respuesta al resolver una sesión
export interface ResolverSesionResponse {
  mensaje: string;
  resultados: {
    correctas: number;
    incorrectas: number;
    pctAciertos: number;
    nuevoGrado: grado_dificultad;
  };
}

// 1. Para el objeto 'ClaseConsulta' (lo que devuelve el backend)
// (Basado en el 'include' que definimos en el servicio 'findAll')
export interface ClaseConsulta {
  id: string;
  idDocente: string | undefined;
  idCurso: string;
  nombre: string;
  descripcion: string;
  fechaClase: string; // Llega como string ISO
  horaInicio: string; // Llega como string (formato "HH:mm" o ISO)
  horaFin: string; // Llega como string
  modalidad: modalidad;
  estadoClase: estado_clase_consulta;
  estadoActual?: estado_clase_consulta;
  deletedAt: string | null; // Llega como string ISO

  // Relaciones (del 'include')
  docenteResponsable: {
    nombre: string;
    apellido: string;
  } | null;
  consultasEnClase: {
    consulta: ConsultaSimple & { id: string };
  }[];
}

export interface ConsultaSimple {
  id: string;
  titulo: string;
  tema: temas;
  descripcion: string;
  fechaConsulta: string;
  alumno: {
    nombre: string;
    apellido: string;
  };
}
