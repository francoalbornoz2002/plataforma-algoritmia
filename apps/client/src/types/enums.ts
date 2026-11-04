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
  En_curso = "En_curso",
  Cancelada = "Cancelada",
  Completada = "Completada",
  Incompleta = "Incompleta",
  No_realizada = "No_realizada",
}

export enum fuente_cambio_dificultad {
  VIDEOJUEGO = "VIDEOJUEGO",
  SESION_REFUERZO = "SESION_REFUERZO",
}
