import { Chip, type ChipProps } from "@mui/material";
import { dificultad_mision } from "../types"; // Ajusta la ruta a 'types'

// 1. Importamos los íconos
import {
  LooksOne,
  LooksTwo,
  Looks3,
  CheckCircleOutline,
} from "@mui/icons-material";

interface MissionDifficultyChip {
  dif: dificultad_mision;
}

export default function MissionDifficultyChip({ dif }: MissionDifficultyChip) {
  let icon: React.ReactElement;
  let color: ChipProps["color"] = "default";

  // 2. Switch para asignar ícono y color
  switch (dif) {
    case dificultad_mision.Facil:
      icon = <LooksOne />;
      color = "success";
      break;
    case dificultad_mision.Medio:
      icon = <LooksTwo />;
      color = "warning";
      break;
    case dificultad_mision.Dificil:
      icon = <Looks3 />;
      color = "error";
      break;
    default:
      icon = <CheckCircleOutline />;
      color = "default";
      break;
  }

  return (
    <Chip
      icon={icon}
      label={dif}
      color={color}
      size="small"
      sx={{
        // 3. Incluimos el fix para el color 'warning'
        ...(color === "warning" && {
          color: "#fff",
          "& .MuiChip-icon": {
            color: "#fff",
          },
        }),
      }}
    />
  );
}
