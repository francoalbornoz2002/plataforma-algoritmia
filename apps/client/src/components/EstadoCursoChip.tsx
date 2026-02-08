// apps/client/src/components/EstadoCursoChip.tsx
import { Chip, type SxProps, type Theme } from "@mui/material";
import { estado_simple } from "../types";

interface EstadoCursoChipProps {
  estado: string | estado_simple;
  deletedAt?: Date | string | null;
  small?: boolean;
  sx?: SxProps<Theme>;
}

export default function EstadoCursoChip({
  estado,
  deletedAt,
  small,
  sx,
}: EstadoCursoChipProps) {
  let label = estado;
  let color: "success" | "error" | "info" | "default" = "default";

  // Normalización de lógica
  const isFinalized =
    estado === estado_simple.Finalizado || estado === "Finalizado";
  const isInactive =
    estado === estado_simple.Inactivo || estado === "Inactivo" || !!deletedAt;
  const isActive = estado === estado_simple.Activo || estado === "Activo";

  if (isFinalized) {
    label = "Finalizado";
    color = "info";
  } else if (isInactive) {
    label = "Inactivo";
    color = "error";
  } else if (isActive) {
    label = "Activo";
    color = "success";
  }

  return (
    <Chip
      label={label}
      size={small ? "small" : "medium"}
      color={color}
      variant="filled"
      sx={sx}
    />
  );
}
