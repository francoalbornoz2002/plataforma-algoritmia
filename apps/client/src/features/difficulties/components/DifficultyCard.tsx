import {
  Card,
  CardContent,
  Box,
  Typography,
  Stack,
  Paper,
} from "@mui/material";
import {
  grado_dificultad,
  type DificultadAlumnoDetallada,
} from "../../../types";
import GradeChip from "../../../components/GradeChip";
import TemaChip from "../../../components/TemaChip";

interface DificultadCardProps {
  dificultad: DificultadAlumnoDetallada;
}

export default function DifficultyCard({ dificultad }: DificultadCardProps) {
  const { nombre, grado, tema, descripcion } = dificultad;

  return (
    <Paper
      elevation={2}
      sx={{
        height: "100%",
        borderTop: "4px solid",
        borderColor:
          grado === grado_dificultad.Bajo
            ? "success.main"
            : grado === grado_dificultad.Medio
              ? "warning.main"
              : grado === grado_dificultad.Alto
                ? "error.main"
                : "divider",
      }}
    >
      <CardContent>
        {/* Fila 1: Título y Grado */}
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Typography variant="h6" component="div" sx={{ lineHeight: 1.3 }}>
            {nombre}
          </Typography>
          <GradeChip grado={grado} small />
        </Stack>

        {/* Fila 2: Tema */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <TemaChip tema={tema} />
        </Stack>

        {/* Fila 3: Descripción */}
        <Typography variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </CardContent>
    </Paper>
  );
}
