import { useState, useEffect, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { getStudentDifficultiesDetail } from "../../services/docentes.service";
import type { DificultadAlumnoDetallada } from "../../types";
import { grado_dificultad, temas } from "../../types";
import DifficultCard from "../alumno/DifficultCard";

interface StudentDifficultyDetailModalProps {
  open: boolean;
  onClose: () => void;
  idCurso: string;
  idAlumno: string;
  nombreAlumno: string;
}

export default function StudentDifficultyDetailModal({
  open,
  onClose,
  idCurso,
  idAlumno,
  nombreAlumno,
}: StudentDifficultyDetailModalProps) {
  const [difficulties, setDifficulties] = useState<DificultadAlumnoDetallada[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro (locales para el modal)
  const [temaFilter, setTemaFilter] = useState("Todos");
  const [gradoFilter, setGradoFilter] = useState("Todos");

  // Efecto de Fetch (se activa cuando el modal se abre)
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setDifficulties([]);
      // Reseteamos filtros al abrir
      setTemaFilter("Todos");
      setGradoFilter("Todos");

      getStudentDifficultiesDetail(idCurso, idAlumno)
        .then((data) => {
          setDifficulties(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idCurso, idAlumno]);

  // Lógica de filtrado (copiada de MyDifficultiesPage)
  const filteredDifficulties = useMemo(() => {
    return difficulties.filter((d) => {
      const matchesTema = temaFilter === "Todos" || d.tema === temaFilter;
      const matchesGrado = gradoFilter === "Todos" || d.grado === gradoFilter;
      return matchesTema && matchesGrado;
    });
  }, [difficulties, temaFilter, gradoFilter]);

  const temasParaFiltrar = useMemo(() => {
    return Object.values(temas).filter((tema) => tema !== "Ninguno");
  }, []);

  const handleTemaChange = (e: SelectChangeEvent<string>) => {
    setTemaFilter(e.target.value);
  };

  const handleGradoChange = (e: SelectChangeEvent<string>) => {
    setGradoFilter(e.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Dificultades de {nombreAlumno}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* --- Filtros --- */}
            <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filtrar por Tema</InputLabel>
                <Select
                  value={temaFilter}
                  label="Filtrar por Tema"
                  onChange={handleTemaChange}
                >
                  <MenuItem value="Todos">Todos los Temas</MenuItem>
                  {temasParaFiltrar.map((tema) => (
                    <MenuItem key={tema} value={tema}>
                      {tema}
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
                  {Object.values(grado_dificultad).map((grado) => (
                    <MenuItem key={grado} value={grado}>
                      {grado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* --- Grid de Dificultades --- */}
            {filteredDifficulties.length === 0 ? (
              <Alert
                severity={difficulties.length === 0 ? "info" : "warning"}
                sx={{ mt: 2 }}
              >
                {difficulties.length === 0
                  ? "Este alumno no tiene dificultades registradas."
                  : "No se encontraron dificultades con esos filtros."}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {filteredDifficulties.map((dificultad) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dificultad.id}>
                    <DifficultCard dificultad={dificultad} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
