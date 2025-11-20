import { Chip } from "@mui/material";

import {
  AccessTime as ProgramadaIcon,
  CheckCircle as RealizadaIcon,
  Cancel as CanceladaIcon,
  PlayCircle as EnCursoIcon, // Icono para En Curso
  FactCheck as PorCerrarIcon, // Icono para Por Cerrar
} from "@mui/icons-material";
import { estado_clase_consulta } from "../types";
import { EstadoClaseLabels } from "../types/traducciones";

interface EstadoClaseChipProps {
  estado: estado_clase_consulta;
}

export const EstadoClaseChip = ({ estado }: EstadoClaseChipProps) => {
  let color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" = "default";
  let icon = <ProgramadaIcon />;

  switch (estado) {
    case estado_clase_consulta.Programada:
      color = "secondary";
      icon = <ProgramadaIcon />;
      break;
    case estado_clase_consulta.Realizada:
      color = "success";
      icon = <RealizadaIcon />;
      break;
    case estado_clase_consulta.No_realizada:
    case "Cancelada":
      color = "error";
      icon = <CanceladaIcon />;
      break;
    case estado_clase_consulta.En_curso:
      color = "success";
      icon = <EnCursoIcon />;
      break;
    case estado_clase_consulta.Finalizada:
      color = "info";
      icon = <PorCerrarIcon />;
      break;
    default:
      color = "default";
  }

  return (
    <Chip
      label={EstadoClaseLabels[estado]}
      color={color}
      icon={icon}
      size="small"
    />
  );
};
