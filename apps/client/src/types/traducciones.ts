import { estado_clase_consulta, estado_consulta } from ".";

export const EstadoClaseLabels: Record<estado_clase_consulta, string> = {
  [estado_clase_consulta.Programada]: "Programada",
  [estado_clase_consulta.Realizada]: "Realizada",
  [estado_clase_consulta.No_realizada]: "No realizada",
  [estado_clase_consulta.Cancelada]: "Cancelada",
  [estado_clase_consulta.Pendiente_Asignacion]: "Pendiente de Asignación",
};

export const EstadoConsultaLabels: Record<estado_consulta, string> = {
  [estado_consulta.Pendiente]: "Pendiente",
  [estado_consulta.A_revisar]: "A Revisar",
  [estado_consulta.Revisada]: "Revisada",
  [estado_consulta.Resuelta]: "Resuelta",
};
