import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Grid, // <-- Importar Grid
  FormControl, // <-- Importar Filtros
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";
import { useCourseContext } from "../../../context/CourseContext";
import {
  grado_dificultad,
  temas,
  type DificultadAlumnoDetallada,
} from "../../../types";
import { getMyDifficulties } from "../../users/services/alumnos.service";
import DifficultyCard from "../components/DifficultyCard";
import { TemasLabels } from "../../../types/traducciones";

export default function MyDifficultiesPage() {
  const { selectedCourse } = useCourseContext();

  // Estados de datos
  const [difficulties, setDifficulties] = useState<DificultadAlumnoDetallada[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ¡NUEVOS ESTADOS DE FILTRO! ---
  const [temaFilter, setTemaFilter] = useState("Todos");
  const [gradoFilter, setGradoFilter] = useState("Todos");

  // Efecto de Fetch (sin cambios)
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

  // --- ¡NUEVA LÓGICA DE FILTRADO! ---
  const filteredDifficulties = useMemo(() => {
    return difficulties.filter((d) => {
      const matchesTema = temaFilter === "Todos" || d.tema === temaFilter;
      const matchesGrado = gradoFilter === "Todos" || d.grado === gradoFilter;
      return matchesTema && matchesGrado;
    });
  }, [difficulties, temaFilter, gradoFilter]);

  // Handlers para los filtros
  const handleTemaChange = (e: SelectChangeEvent<string>) => {
    setTemaFilter(e.target.value);
  };

  const handleGradoChange = (e: SelectChangeEvent<string>) => {
    setGradoFilter(e.target.value);
  };

  // --- RENDERIZADO ---

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
      <Typography variant="h5" gutterBottom>
        Mis Dificultades en {selectedCourse.nombre}
      </Typography>

      {/* --- SECCIÓN DE FILTROS --- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, mt: 2 }}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Tema</InputLabel>
          <Select
            value={temaFilter}
            label="Filtrar por Tema"
            onChange={handleTemaChange}
          >
            <MenuItem value="Todos">Todos los Temas</MenuItem>
            {/* Iteramos sobre el enum 'temas', omitimos el "Ninguno" */}
            {Object.values(temas)
              .filter((tema) => tema !== temas.Ninguno)
              .map((tema) => (
                <MenuItem key={tema} value={tema}>
                  {TemasLabels[tema]}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Grado</InputLabel>
          <Select
            value={gradoFilter}
            label="Filtrar por Grado"
            onChange={handleGradoChange}
          >
            <MenuItem value="Todos">Todos los Grados</MenuItem>
            {/* Iteramos sobre el enum 'grado_dificultad' */}
            {Object.values(grado_dificultad).map((grado) => (
              <MenuItem key={grado} value={grado}>
                {grado}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* --- SECCIÓN DE CONTENIDO (GRID) --- */}
      {filteredDifficulties.length === 0 ? (
        <Alert
          severity={difficulties.length === 0 ? "success" : "info"}
          sx={{ mt: 2 }}
        >
          {difficulties.length === 0
            ? "¡Felicidades! Aún no se han detectado dificultades en tu progreso."
            : "No se encontraron dificultades que coincidan con tus filtros."}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredDifficulties.map((dificultad) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dificultad.id}>
              <DifficultyCard dificultad={dificultad} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
