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
  Paper,
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
import HeaderPage from "../../../components/HeaderPage";
import { Warning, WarningAmber } from "@mui/icons-material";

export default function MyDifficultiesPage() {
  const { selectedCourse } = useCourseContext();

  // Estados de datos
  const [difficulties, setDifficulties] = useState<DificultadAlumnoDetallada[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ¡NUEVOS ESTADOS DE FILTRO! ---
  const [temaFilter, setTemaFilter] = useState("");
  const [gradoFilter, setGradoFilter] = useState("");

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
      const matchesTema = !temaFilter || d.tema === temaFilter;
      const matchesGrado = !gradoFilter || d.grado === gradoFilter;
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
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Mis dificultades en ${selectedCourse.nombre}`}
          description="Consulta aquellos temas y conceptos que te están resultando desafiantes."
          icon={<Warning />}
          color="primary"
        />
        {/* --- SECCIÓN DE FILTROS --- */}
        <Paper elevation={2} sx={{ pt: 1, pb: 2, pr: 2, pl: 2 }}>
          <Typography variant="overline" sx={{ fontSize: "14px" }}>
            Filtros de búsqueda
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ width: 250 }}>
              <InputLabel>Tema</InputLabel>
              <Select
                name="tema"
                value={temaFilter}
                label="Tema"
                onChange={handleTemaChange}
              >
                <MenuItem value="">Todos</MenuItem>
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
                <MenuItem value="">Todos los Grados</MenuItem>
                {/* Iteramos sobre el enum 'grado_dificultad' */}
                {Object.values(grado_dificultad)
                  .filter((grado) => grado !== grado_dificultad.Ninguno)
                  .map((grado) => (
                    <MenuItem key={grado} value={grado}>
                      {grado}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

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
      </Stack>
    </Box>
  );
}
