import { Chip, type ChipProps } from "@mui/material";
import { grado_dificultad } from "../types";
import DangerousIcon from "@mui/icons-material/Dangerous";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface GradeChipProps {
  texto?: string;
  grado: grado_dificultad;
  small?: boolean;
}

export default function GradeChip({ texto, grado, small }: GradeChipProps) {
  let icon: React.ReactElement | undefined = undefined;
  let color: ChipProps["color"] = "default";

  // 2. Usamos un switch para asignar ícono y color basado en el 'grado'
  switch (grado) {
    case grado_dificultad.Alto:
      icon = <DangerousIcon sx={{ fontSize: "1.25rem" }} />; // Hacemos el ícono un poco más grande
      color = "error";
      break;
    case grado_dificultad.Medio:
      icon = <WarningIcon sx={{ fontSize: "1.25rem" }} />;
      color = "warning";
      break;
    case grado_dificultad.Bajo:
      icon = <CheckCircleIcon sx={{ fontSize: "1.25rem" }} />;
      color = "success";
      break;
    case grado_dificultad.Ninguno:
      icon = <RemoveCircleIcon sx={{ fontSize: "1.25rem" }} />;
      color = "default";
      break;
  }

  let textoRender = grado.toString();
  if (texto) {
    textoRender = `${texto} ${grado}`;
  }

  // 3. Renderizamos el Chip con las props dinámicas
  return (
    <Chip
      label={textoRender}
      color={color}
      icon={icon}
      size={small ? "small" : "medium"}
      variant="filled"
      sx={{
        fontWeight: "bold",
      }}
    />
  );
}
