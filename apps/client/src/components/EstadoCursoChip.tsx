// apps/client/src/components/EstadoCursoChip.tsx
import { Chip, type SxProps, type Theme } from "@mui/material";
import { estado_simple } from "../types";

interface EstadoCursoChipProps {
  estado: string | estado_simple;
  deletedAt?: Date | string | null;
  small?: boolean;
  sx?: SxProps<Theme>;
}

const CONFIG = {
  Finalizado: { label: "Finalizado", color: "info" as const },
  Inactivo: { label: "Inactivo", color: "error" as const },
  Activo: { label: "Activo", color: "success" as const },
};

export default function EstadoCursoChip({
  estado,
  deletedAt,
  small,
  sx,
}: EstadoCursoChipProps) {
  // Normalización de lógica
  const isFinalized =
    estado === estado_simple.Finalizado || estado === "Finalizado";
  const isInactive =
    estado === estado_simple.Inactivo || estado === "Inactivo" || !!deletedAt;
  const isActive = estado === estado_simple.Activo || estado === "Activo";

  const computedState = isFinalized
    ? "Finalizado"
    : isInactive
      ? "Inactivo"
      : isActive
        ? "Activo"
        : null;

  const { label = estado.toString(), color = "default" } = computedState
    ? CONFIG[computedState]
    : {};

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
