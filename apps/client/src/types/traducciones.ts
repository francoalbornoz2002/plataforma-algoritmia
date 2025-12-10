import { estado_clase_consulta, estado_consulta, temas } from ".";

export const EstadoClaseLabels: Record<estado_clase_consulta, string> = {
  [estado_clase_consulta.Programada]: "Programada",
  [estado_clase_consulta.Realizada]: "Realizada",
  [estado_clase_consulta.No_realizada]: "No realizada",
  [estado_clase_consulta.Cancelada]: "Cancelada",
  [estado_clase_consulta.Pendiente_Asignacion]: "Pendiente de Asignación",
  [estado_clase_consulta.En_curso]: "En Curso",
  [estado_clase_consulta.Finalizada]: "Finalizada",
};

export const EstadoConsultaLabels: Record<estado_consulta, string> = {
  [estado_consulta.Pendiente]: "Pendiente",
  [estado_consulta.A_revisar]: "A Revisar",
  [estado_consulta.Revisada]: "Revisada",
  [estado_consulta.Resuelta]: "Resuelta",
};

export const TemasLabels: Record<temas, string> = {
  [temas.Ninguno]: "Ninguno",
  [temas.Secuencia]: "Secuencia y Lógica Básica",
  [temas.Logica]: "Lógica Proposicional",
  [temas.Estructuras]: "Estructuras de Control",
  [temas.Variables]: "Variables",
  [temas.Procedimientos]: "Procedimientos",
};
