import { Chip, type ChipProps, type SxProps } from "@mui/material";
import { grado_dificultad } from "../types";
import DangerousIcon from "@mui/icons-material/Dangerous";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface GradeChipProps {
  texto?: string;
  grado: grado_dificultad;
  small?: boolean;
  sx?: SxProps;
}

const CONFIG: Record<
  string,
  { color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [grado_dificultad.Alto]: {
    color: "error",
    icon: <DangerousIcon sx={{ fontSize: "1.25rem" }} />,
  },
  [grado_dificultad.Medio]: {
    color: "warning",
    icon: <WarningIcon sx={{ fontSize: "1.25rem" }} />,
  },
  [grado_dificultad.Bajo]: {
    color: "success",
    icon: <CheckCircleIcon sx={{ fontSize: "1.25rem" }} />,
  },
  [grado_dificultad.Ninguno]: {
    color: "default",
    icon: <RemoveCircleIcon sx={{ fontSize: "1.25rem" }} />,
  },
};

export default function GradeChip({ texto, grado, small, sx }: GradeChipProps) {
  const { color = "default", icon } = CONFIG[grado] || {};
  const textoRender = texto ? `${texto} ${grado}` : grado.toString();

  // 3. Renderizamos el Chip con las props dinámicas
  return (
    <Chip
      label={textoRender}
      color={color}
      icon={icon}
      size={small ? "small" : "medium"}
      variant="filled"
      sx={{
        ...sx,
        fontWeight: "bold",
      }}
    />
  );
}
