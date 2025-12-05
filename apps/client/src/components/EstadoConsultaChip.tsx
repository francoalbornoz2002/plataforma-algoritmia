import { Chip, type ChipProps } from "@mui/material";
import { estado_consulta } from "../types"; // Ajusta la ruta a 'types'

// 1. Importamos los íconos
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"; // Pendiente
import VisibilityIcon from "@mui/icons-material/Visibility"; // Revisada
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Resuelta
import { HelpOutline } from "@mui/icons-material";
import { EstadoConsultaLabels } from "../types/traducciones";

interface EstadoConsultaChipProps {
  estado: estado_consulta;
}

export default function EstadoConsultaChip({
  estado,
}: EstadoConsultaChipProps) {
  let icon: React.ReactElement;
  let color: ChipProps["color"] = "default";

  // 2. Switch para asignar ícono y color
  switch (estado) {
    case estado_consulta.Pendiente:
      icon = <HourglassEmptyIcon />;
      color = "default"; // Gris
      break;
    case estado_consulta.Revisada:
      icon = <VisibilityIcon />;
      color = "info"; // Azul
      break;
    case estado_consulta.Resuelta:
      icon = <CheckCircleIcon />;
      color = "success"; // Verde
      break;
    default:
      icon = <HelpOutline />;
      color = "default";
      break;
  }

  return (
    <Chip
      icon={icon}
      label={EstadoConsultaLabels[estado]}
      color={color}
      variant="filled" // Usamos filled para que se destaque
      sx={{ ml: 1, flexShrink: 0 }}
    />
  );
}
