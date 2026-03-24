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
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import {
  grado_dificultad,
  temas,
  type DificultadAlumnoDetallada,
} from "../../../types";
import { getStudentDifficultiesDetail } from "../../users/services/docentes.service";
import DifficultyCard from "./DifficultyCard";
import { TemasLabels } from "../../../types/traducciones";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

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
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro (locales para el modal)
  const [temaFilter, setTemaFilter] = useState("");
  const [gradoFilter, setGradoFilter] = useState("");

  // Efecto de Fetch (se activa cuando el modal se abre)
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setDifficulties([]);
      // Reseteamos filtros al abrir
      setTemaFilter("");
      setGradoFilter("");

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
      const matchesTema = !temaFilter || d.tema === temaFilter;
      const matchesGrado = !gradoFilter || d.grado === gradoFilter;
      return matchesTema && matchesGrado;
    });
  }, [difficulties, temaFilter, gradoFilter]);

  const handleClearFilters = () => {
    setTemaFilter("");
    setGradoFilter("");
  };

  const handleTemaChange = (e: SelectChangeEvent<string>) => {
    setTemaFilter(e.target.value);
  };

  const handleGradoChange = (e: SelectChangeEvent<string>) => {
    setGradoFilter(e.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle bgcolor="primary.main" color="white">
        Dificultades de {nombreAlumno}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "grey.100", height: 600 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <Stack spacing={2} mt={2}>
            {/* --- Filtros --- */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <FormControl size="small" sx={{ width: 270 }}>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={temaFilter}
                  label="Tema"
                  onChange={handleTemaChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.values(temas)
                    .filter((tema) => tema !== "Ninguno")
                    .map((tema) => (
                      <MenuItem key={tema} value={tema}>
                        {TemasLabels[tema]}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={gradoFilter}
                  label="Grado"
                  onChange={handleGradoChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.values(grado_dificultad)
                    .filter((grado) => grado !== "Ninguno")
                    .map((grado) => (
                      <MenuItem key={grado} value={grado}>
                        {grado}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Tooltip title="Limpiar filtros">
                <IconButton
                  onClick={handleClearFilters}
                  size="small"
                  color="primary"
                >
                  <FilterAltOffIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* --- Grid de Dificultades --- */}
            {filteredDifficulties.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {difficulties.length === 0
                  ? "Este alumno no tiene dificultades registradas."
                  : "No se encontraron dificultades con esos filtros."}
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
