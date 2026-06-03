import { Chip, type SxProps, type ChipProps } from "@mui/material";

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
  sx?: SxProps;
}

const CONFIG: Record<
  string,
  { color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [estado_clase_consulta.Programada]: {
    color: "info",
    icon: <ProgramadaIcon />,
  },
  [estado_clase_consulta.Realizada]: {
    color: "success",
    icon: <RealizadaIcon />,
  },
  [estado_clase_consulta.No_realizada]: {
    color: "error",
    icon: <CanceladaIcon />,
  },
  [estado_clase_consulta.Cancelada]: {
    color: "error",
    icon: <CanceladaIcon />,
  },
  [estado_clase_consulta.En_curso]: { color: "success", icon: <EnCursoIcon /> },
  [estado_clase_consulta.Finalizada]: {
    color: "secondary",
    icon: <PorCerrarIcon />,
  },
};

export const EstadoClaseChip = ({ estado, sx }: EstadoClaseChipProps) => {
  const { color = "default", icon = <ProgramadaIcon /> } = CONFIG[estado] || {};

  return (
    <Chip
      label={EstadoClaseLabels[estado] || estado}
      color={color}
      icon={icon}
      size="small"
      sx={sx}
    />
  );
};
