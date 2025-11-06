import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  type ChipProps,
} from "@mui/material";

// 1. Importamos los íconos para la dificultad de la misión
import StarIcon from "@mui/icons-material/Star"; // Estrellas
import BoltIcon from "@mui/icons-material/Bolt"; // EXP
import ReplayIcon from "@mui/icons-material/Replay"; // Intentos
import LockIcon from "@mui/icons-material/Lock"; // Pendiente
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Completada
import {
  LooksOne, // Fácil (1)
  LooksTwo, // Medio (2)
  Looks3, // Difícil (3)
} from "@mui/icons-material"; // (O puedes usar otros que te gusten)
import {
  dificultad_mision,
  type MisionCompletada,
  type MisionConEstado,
} from "../types";
import MissionDifficultyChip from "./MissionDifficultyChip";

interface MissionCardProps {
  missionData: MisionConEstado;
}

// --- Helper para mostrar los Stats si está completada ---
function CompletedStats({ data }: { data: MisionCompletada }) {
  return (
    <Stack direction="row" spacing={2} justifyContent="space-around">
      <Chip
        icon={<StarIcon />}
        label={`${data.estrellas} Estrellas`}
        size="small"
        variant="outlined"
        color="warning"
      />
      <Chip
        icon={<BoltIcon />}
        label={`${data.exp} EXP`}
        size="small"
        variant="outlined"
        color="primary"
      />
      <Chip
        icon={<ReplayIcon />}
        label={`${data.intentos} Intentos`}
        size="small"
        variant="outlined"
        color="default"
      />
    </Stack>
  );
}

// --- Componente Principal ---
export default function MissionCard({ missionData }: MissionCardProps) {
  const { mision, completada } = missionData;
  const isCompleted = completada !== null;

  return (
    <Card
      sx={{
        height: "100%",
        variant: "outlined",
        opacity: isCompleted ? 1.0 : 0.6, // Opaco si está pendiente
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Fila 1: Título y Dificultad */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ mb: 0, lineHeight: 1.3 }}
          >
            {mision.nombre}
          </Typography>
          <MissionDifficultyChip dif={mision.dificultadMision} />
        </Box>

        {/* Fila 2: Descripción */}
        <Typography variant="body2" color="text.secondary">
          {mision.descripcion}
        </Typography>
      </CardContent>

      {/* Fila 3: Stats (Condicional) */}
      <Divider sx={{ mt: "auto" }} />
      <Box sx={{ p: 2, bgcolor: isCompleted ? "#f5fff5" : "#fafafa" }}>
        {isCompleted ? (
          // Si está completada, muestra los stats
          <CompletedStats data={completada} />
        ) : (
          // Si está pendiente, muestra un chip
          <Chip
            icon={<LockIcon />}
            label="Pendiente"
            size="small"
            sx={{ width: "100%" }}
          />
        )}
      </Box>
    </Card>
  );
}
