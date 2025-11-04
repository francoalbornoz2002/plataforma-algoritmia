import { Card, CardContent, Box, Typography, Stack } from "@mui/material";
import type { DificultadAlumnoDetallada } from "../../types";
import GradeChip from "../../components/GradeChip";
import TemaChip from "../../components/TemaChip";

interface DificultadCardProps {
  dificultad: DificultadAlumnoDetallada;
}

export default function DifficultCard({ dificultad }: DificultadCardProps) {
  const { nombre, grado, tema, descripcion } = dificultad;

  return (
    <Card sx={{ height: "100%" }} variant="outlined">
      <CardContent>
        {/* Fila 1: Título y Grado */}
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
            {nombre}
          </Typography>
          <GradeChip grado={grado} />
        </Box>

        {/* Fila 2: Tema */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <TemaChip tema={tema} />
        </Stack>

        {/* Fila 3: Descripción */}
        <Typography variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </CardContent>
    </Card>
  );
}
