import { Chip, type ChipProps } from "@mui/material";
import { grado_dificultad } from "../types";
import DangerousIcon from "@mui/icons-material/Dangerous";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface GradeChipProps {
  texto?: string;
  grado: grado_dificultad;
}

export default function GradeChip({ texto, grado }: GradeChipProps) {
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
      icon = <InfoIcon sx={{ fontSize: "1.25rem" }} />;
      color = "info";
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
      variant="filled" // 'filled' resalta más que 'outlined' para el grado
      sx={{
        ml: 1,
        flexShrink: 0,
        ...(color === "warning" && {
          color: "#fff", // Esto cambia el color del texto (label)
          "& .MuiChip-icon": {
            color: "#fff", // Esto cambia el color del ícono (svg)
          },
        }),
      }}
    />
  );
}
