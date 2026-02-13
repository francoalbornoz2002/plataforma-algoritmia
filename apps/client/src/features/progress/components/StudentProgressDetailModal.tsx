import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import {
  type ProgresoAlumnoDetallado,
  type MisionCompletada,
  type MisionEspecial,
  dificultad_mision,
} from "../../../types";
import MissionCard from "./MissionCard";
import { AutoAwesome, SportsEsports } from "@mui/icons-material";
import { datePickerConfig } from "../../../config/theme.config";

interface StudentProgressDetailModalProps {
  open: boolean;
  onClose: () => void;
  studentData: ProgresoAlumnoDetallado;
}

export default function StudentProgressDetailModal({
  open,
  onClose,
  studentData,
}: StudentProgressDetailModalProps) {
  const [normalMissions, setNormalMissions] = useState<MisionCompletada[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<MisionCompletada[]>(
    [],
  );
  const [specialMissions, setSpecialMissions] = useState<MisionEspecial[]>([]);

  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
    dificultad: "",
    estrellas: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentData) {
      try {
        const completed = studentData.misionesCompletadas || [];
        setNormalMissions(completed);
        setFilteredMissions(completed);
        setSpecialMissions(studentData.misionesEspeciales || []);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error al procesar los datos del alumno.");
        setLoading(false);
      }
    }
  }, [studentData]);

  // --- LÓGICA DE FILTRADO ---
  useEffect(() => {
    let result = [...normalMissions];

    if (filters.fechaDesde) {
      result = result.filter(
        (m) =>
          m.fechaCompletado &&
          new Date(m.fechaCompletado) >=
            new Date(filters.fechaDesde + "T00:00:00"),
      );
    }

    if (filters.fechaHasta) {
      result = result.filter(
        (m) =>
          m.fechaCompletado &&
          new Date(m.fechaCompletado) <=
            new Date(filters.fechaHasta + "T23:59:59"),
      );
    }

    if (filters.dificultad) {
      result = result.filter(
        (m) => m.mision.dificultadMision === filters.dificultad,
      );
    }

    if (filters.estrellas) {
      result = result.filter((m) => m.estrellas === Number(filters.estrellas));
    }

    setFilteredMissions(result);
  }, [filters, normalMissions]);

  const handleFilterChange = (
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Progreso de {studentData.nombre} {studentData.apellido}
      </DialogTitle>
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
          <Stack spacing={2}>
            {/* --- SECCIÓN 1: CAMPAÑA --- */}
            <Stack spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                color="primary.main"
              >
                <SportsEsports fontSize="large" />
                <Typography variant="h6" fontWeight="bold">
                  Misiones de Campaña
                </Typography>
              </Stack>

              {/* --- FILTROS --- */}
              <Paper elevation={1} sx={{ pt: 1, pb: 2, pr: 2, pl: 2, mb: 2 }}>
                <Typography variant="overline" sx={{ fontSize: "14px" }}>
                  Filtros de búsqueda
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <DatePicker
                    label="Fecha de inicio"
                    value={
                      filters.fechaDesde
                        ? new Date(filters.fechaDesde + "T00:00:00")
                        : null
                    }
                    onChange={(val) =>
                      setFilters({
                        ...filters,
                        fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
                      })
                    }
                    {...datePickerConfig}
                    disableFuture
                  />
                  <DatePicker
                    label="Fecha de fin"
                    value={
                      filters.fechaHasta
                        ? new Date(filters.fechaHasta + "T00:00:00")
                        : null
                    }
                    onChange={(val) =>
                      setFilters({
                        ...filters,
                        fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
                      })
                    }
                    {...datePickerConfig}
                    disableFuture
                  />
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Dificultad</InputLabel>
                    <Select
                      name="dificultad"
                      value={filters.dificultad}
                      label="Dificultad"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value={dificultad_mision.Facil}>Fácil</MenuItem>
                      <MenuItem value={dificultad_mision.Medio}>Medio</MenuItem>
                      <MenuItem value={dificultad_mision.Dificil}>
                        Difícil
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Estrellas</InputLabel>
                    <Select
                      name="estrellas"
                      value={filters.estrellas}
                      label="Estrellas"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Paper>

              {normalMissions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4 }}>
                  Este alumno no tiene misiones de campaña completadas.
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {filteredMissions.map((m) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.mision.id}>
                      <MissionCard missionData={m} />
                    </Grid>
                  ))}
                  {filteredMissions.length === 0 &&
                    normalMissions.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="info" sx={{ width: "100%" }}>
                          No se encontraron misiones con los filtros aplicados.
                        </Alert>
                      </Grid>
                    )}
                </Grid>
              )}
            </Stack>

            {/* --- DIVISOR --- */}
            <Divider />

            {/* --- SECCIÓN 2: ESPECIALES --- */}
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Box sx={{ color: "#9c27b0", display: "flex" }}>
                  <AutoAwesome fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight="bold" color="#9c27b0">
                  Misiones Especiales
                </Typography>
              </Stack>

              {specialMissions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4 }}>
                  Este alumno no tiene misiones especiales completadas.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {specialMissions.map((missionData) => (
                    <Grid
                      size={{ xs: 12, sm: 6, md: 4 }}
                      key={missionData.id} // UUID
                    >
                      {/* MissionCard ya es polimórfico y acepta MisionEspecial */}
                      <MissionCard missionData={missionData} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
