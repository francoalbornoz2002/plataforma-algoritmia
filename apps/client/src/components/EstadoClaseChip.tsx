import { Chip, type ChipProps } from "@mui/material";
import { estado_clase_consulta } from "../types"; // Ajusta la ruta a 'types'

// 1. Importamos los íconos
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // Programada
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Realizada
import CancelIcon from "@mui/icons-material/Cancel"; // Cancelada
import WarningIcon from "@mui/icons-material/Warning"; // No realizada
import { EstadoClaseLabels } from "../types/traducciones";

interface EstadoClaseChipProps {
  estado: estado_clase_consulta;
}

export default function EstadoClaseChip({ estado }: EstadoClaseChipProps) {
  let icon: React.ReactElement;
  let color: ChipProps["color"] = "default";

  // 2. Switch para asignar ícono y color
  switch (estado) {
    case estado_clase_consulta.Programada:
      icon = <EventAvailableIcon />;
      color = "info"; // Azul
      break;
    case estado_clase_consulta.Realizada:
      icon = <CheckCircleIcon />;
      color = "success"; // Verde
      break;
    case estado_clase_consulta.Cancelada:
      icon = <CancelIcon />;
      color = "error"; // Rojo
      break;
    case estado_clase_consulta.No_realizada:
      icon = <WarningIcon />;
      color = "warning"; // Amarillo
      break;
    default:
      icon = <WarningIcon />;
      color = "default";
  }

  return (
    <Chip
      icon={icon}
      label={EstadoClaseLabels[estado]}
      color={color}
      size="small"
      variant="filled"
      sx={{
        // Arreglamos el color del texto 'warning' (como hicimos antes)
        ...(color === "warning" && {
          color: "#fff",
          "& .MuiChip-icon": { color: "#fff" },
        }),
      }}
    />
  );
}
