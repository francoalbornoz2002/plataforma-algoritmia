import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
} from "@mui/material";

// 1. Importamos los íconos para la dificultad de la misión
import StarIcon from "@mui/icons-material/Star"; // Estrellas
import BoltIcon from "@mui/icons-material/Bolt"; // EXP
import ReplayIcon from "@mui/icons-material/Replay"; // Intentos
import LockIcon from "@mui/icons-material/Lock"; // Pendiente
import type {
  MisionCompletada,
  MisionConEstado,
  MisionEspecial,
} from "../../../types";
import MissionDifficultyChip from "../../../components/MissionDifficultyChip";

type MissionItem = MisionConEstado | MisionCompletada | MisionEspecial;

interface MissionCardProps {
  missionData: MissionItem;
  hideStatus?: boolean;
}

// --- Helper para mostrar los Stats si está completada ---
function CompletedStats({ data }: { data: MisionCompletada | MisionEspecial }) {
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
export default function MissionCard({
  missionData,
  hideStatus = false,
}: MissionCardProps) {
  // LÓGICA DE NORMALIZACIÓN
  let nombre = "";
  let descripcion = "";
  let dificultad = null;
  let numero: number | undefined;

  // Definimos explícitamente el tipo de la variable para que TS no se queje
  let completedData: MisionCompletada | MisionEspecial | null = null;

  let isSpecial = false;

  // CASO A: MisionEspecial (Tiene 'nombre' en la raíz y NO tiene 'mision')
  if ("nombre" in missionData && !("mision" in missionData)) {
    const m = missionData as MisionEspecial;
    nombre = m.nombre;
    descripcion = m.descripcion;
    completedData = m; // MisionEspecial cumple con la estructura de stats
    isSpecial = true;
  }
  // CASO B: MisionConEstado (Tiene objeto 'mision' y propiedad 'completada')
  else if ("mision" in missionData && "completada" in missionData) {
    const m = missionData as MisionConEstado;
    nombre = m.mision.nombre;
    descripcion = m.mision.descripcion;
    dificultad = m.mision.dificultadMision;
    numero = m.mision.numero;
    completedData = m.completada;
  }
  // CASO C: MisionCompletada (Tiene objeto 'mision' y stats en la raíz)
  else if ("mision" in missionData) {
    const m = missionData as MisionCompletada;
    nombre = m.mision.nombre;
    descripcion = m.mision.descripcion;
    dificultad = m.mision.dificultadMision;
    numero = m.mision.numero;
    completedData = m;
  }

  const isCompleted = completedData !== null;

  return (
    <Card
      sx={{
        height: "100%",
        variant: "outlined",
        opacity: isCompleted || hideStatus ? 1.0 : 0.6,
        display: "flex",
        flexDirection: "column",
        // Borde especial si es misión especial
        borderColor: isSpecial ? "purple" : undefined,
        borderWidth: isSpecial ? 2 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
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
            sx={{
              mb: 0,
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {numero !== undefined && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                {numero}
              </Box>
            )}
            {nombre}
            {isSpecial && (
              <Chip label="Especial" color="secondary" size="small" />
            )}
          </Typography>

          {/* Solo mostramos chip de dificultad si existe (Normales) */}
          {dificultad && <MissionDifficultyChip dif={dificultad} />}
        </Box>

        <Typography variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </CardContent>

      {!hideStatus && (
        <>
          <Divider sx={{ mt: "auto" }} />
          <Box
            sx={{
              p: 2,
              bgcolor: isCompleted
                ? isSpecial
                  ? "#f3e5f5"
                  : "#f5fff5"
                : "#fafafa",
            }}
          >
            {isCompleted ? (
              <CompletedStats data={completedData!} />
            ) : (
              <Chip
                icon={<LockIcon />}
                label="Pendiente"
                size="small"
                sx={{ width: "100%" }}
              />
            )}
          </Box>
        </>
      )}
    </Card>
  );
}
