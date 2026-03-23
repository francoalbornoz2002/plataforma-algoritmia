import { Chip, type ChipProps } from "@mui/material";
import { estado_sesion } from "../../../types";
import { EstadoSesionLabels } from "../../../types/traducciones";

export const getEstadoSesionColor = (
  estado: estado_sesion | string,
): "info" | "success" | "warning" | "error" | "default" | "primary" => {
  switch (estado) {
    case estado_sesion.Pendiente:
      return "info";
    case estado_sesion.En_curso:
      return "primary";
    case estado_sesion.Completada:
      return "success";
    case estado_sesion.Incompleta:
      return "warning";
    case estado_sesion.No_realizada:
      return "error";
    case estado_sesion.Cancelada:
    default:
      return "default";
  }
};

interface EstadoSesionChipProps extends Omit<ChipProps, "color" | "label"> {
  estado: estado_sesion | string;
}

export default function EstadoSesionChip({
  estado,
  sx,
  ...props
}: EstadoSesionChipProps) {
  return (
    <Chip
      label={
        EstadoSesionLabels[estado as estado_sesion] || estado.replace("_", " ")
      }
      color={getEstadoSesionColor(estado)}
      size="small"
      sx={{ fontSize: "0.7rem", fontWeight: "bold", ...sx }}
      {...props}
    />
  );
}
