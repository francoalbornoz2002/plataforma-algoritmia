import { Chip, type ChipProps } from "@mui/material";
import { estado_consulta } from "../types"; // Ajusta la ruta a 'types'

// 1. Importamos los íconos
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"; // Pendiente
import VisibilityIcon from "@mui/icons-material/Visibility"; // Revisada
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Resuelta
import { HelpOutline } from "@mui/icons-material";
import BlockIcon from "@mui/icons-material/Block"; // No resuelta
import { EstadoConsultaLabels } from "../types/traducciones";

interface EstadoConsultaChipProps {
  estado: estado_consulta;
  small?: boolean;
}

const CONFIG: Record<
  string,
  { color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [estado_consulta.Pendiente]: { color: "info", icon: <HourglassEmptyIcon /> },
  [estado_consulta.Revisada]: { color: "primary", icon: <VisibilityIcon /> },
  [estado_consulta.Resuelta]: { color: "success", icon: <CheckCircleIcon /> },
  [estado_consulta.No_resuelta]: { color: "error", icon: <BlockIcon /> },
  [estado_consulta.A_revisar]: { color: "warning", icon: <HelpOutline /> },
};

export default function EstadoConsultaChip({
  estado,
  small,
}: EstadoConsultaChipProps) {
  const { color = "default", icon = <HelpOutline /> } = CONFIG[estado] || {};

  return (
    <Chip
      icon={icon}
      label={EstadoConsultaLabels[estado]}
      color={color}
      variant="filled"
      size={small ? "small" : "medium"}
    />
  );
}
