import { Chip, type ChipProps } from "@mui/material";
import { dificultad_mision } from "../types";
import {
  LooksOne,
  LooksTwo,
  Looks3,
  CheckCircleOutline,
} from "@mui/icons-material";

interface MissionDifficultyChip {
  dif: dificultad_mision;
}

const CONFIG: Record<
  string,
  { color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [dificultad_mision.Facil]: { color: "success", icon: <LooksOne /> },
  [dificultad_mision.Medio]: { color: "warning", icon: <LooksTwo /> },
  [dificultad_mision.Dificil]: { color: "error", icon: <Looks3 /> },
};

export default function MissionDifficultyChip({ dif }: MissionDifficultyChip) {
  const { color = "default", icon = <CheckCircleOutline /> } =
    CONFIG[dif] || {};

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
