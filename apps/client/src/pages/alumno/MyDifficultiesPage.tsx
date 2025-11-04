import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useCourseContext } from "../../context/CourseContext";
import { getMyDifficulties } from "../../services/alumnos.service";
import type { DificultadAlumnoDetallada } from "../../types";
import { grado_dificultad, temas } from "../../types"; // Asumo que los enums están en types

// Helper para dar color al Chip de Grado
const getGradoColor = (grado: grado_dificultad) => {
  switch (grado) {
    case grado_dificultad.Alto:
      return "error";
    case grado_dificultad.Medio:
      return "warning";
    case grado_dificultad.Bajo:
      return "info";
    default:
      return "default";
  }
};

export default function MyDifficultiesPage() {
  const { selectedCourse } = useCourseContext();
  const [difficulties, setDifficulties] = useState<DificultadAlumnoDetallada[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourse) {
      setLoading(false);
      setError(null);
      setDifficulties([]);
      return;
    }

    setLoading(true);
    setError(null);
    getMyDifficulties(selectedCourse.id)
      .then((data) => {
        setDifficulties(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCourse]);

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver tus dificultades.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mis Dificultades en {selectedCourse.nombre}
      </Typography>

      {difficulties.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          ¡Felicidades! Aún no se han detectado dificultades en tu progreso.
        </Alert>
      ) : (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {difficulties.map((dificultad) => (
            <Accordion key={dificultad.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: "100%" }}
                >
                  <Typography variant="h6">{dificultad.nombre}</Typography>
                  <Chip
                    label={dificultad.grado}
                    color={getGradoColor(dificultad.grado)}
                    size="small"
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Chip
                  label={dificultad.tema}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Typography>{dificultad.descripcion}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Box>
  );
}
