import { Typography, Stack, Paper, Box } from "@mui/material";
import {
  grado_dificultad,
  type DificultadAlumnoDetallada,
} from "../../../types";
import CardIcon from "../../../components/CardIcon";
import { TemasLabels } from "../../../types/traducciones";
import { useDifficultyIcon } from "../hooks/useDifficultyIcon";

interface DificultadCardProps {
  dificultad: DificultadAlumnoDetallada;
}

export default function DifficultyCard({ dificultad }: DificultadCardProps) {
  const { nombre, grado, tema, descripcion } = dificultad;

  // Obtenemos el ícono correspondiente según el nombre de la dificultad
  const icon = useDifficultyIcon(nombre);

  // Determinamos el color basado en el grado de dificultad
  const color =
    grado === grado_dificultad.Alto
      ? "error"
      : grado === grado_dificultad.Medio
        ? "warning"
        : grado === grado_dificultad.Bajo
          ? "success"
          : "info"; // Fallback para grado "Ninguno"

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        height: "100%",
      }}
    >
      <Stack spacing={1} alignItems="center">
        <CardIcon icon={icon} color={color} size="large" />

        <Typography
          fontWeight="bold"
          align="center"
          sx={{ lineHeight: 1.2, fontSize: 18 }}
        >
          {nombre}
        </Typography>

        <Typography variant="caption" align="center" fontWeight="bold">
          <Box component="span" sx={{ color: `${color}.main` }}>
            GRADO {grado.toUpperCase()}
          </Box>
          <Box component="span" sx={{ color: "text.secondary" }}>
            {" - "}
            {TemasLabels[tema].toUpperCase()}
          </Box>
        </Typography>

        <Typography align="center" variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </Stack>
    </Paper>
  );
}
