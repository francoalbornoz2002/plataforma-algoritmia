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
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Tooltip,
  IconButton,
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
import { AutoAwesome, SportsEsports, FilterAltOff } from "@mui/icons-material";
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
    orden: "numero-asc",
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

    // --- ORDENAMIENTO ---
    result.sort((a, b) => {
      switch (filters.orden) {
        case "recientes": {
          const dateA = a.fechaCompletado
            ? new Date(a.fechaCompletado).getTime()
            : 0;
          const dateB = b.fechaCompletado
            ? new Date(b.fechaCompletado).getTime()
            : 0;
          return dateB - dateA;
        }
        case "antiguas": {
          const dateA = a.fechaCompletado
            ? new Date(a.fechaCompletado).getTime()
            : Infinity;
          const dateB = b.fechaCompletado
            ? new Date(b.fechaCompletado).getTime()
            : Infinity;
          return dateA - dateB;
        }
        case "estrellas-desc":
          return b.estrellas - a.estrellas;
        case "estrellas-asc":
          return a.estrellas - b.estrellas;
        case "intentos-desc":
          return b.intentos - a.intentos;
        case "intentos-asc":
          return a.intentos - b.intentos;
        case "exp-desc":
          return b.exp - a.exp;
        case "exp-asc":
          return a.exp - b.exp;
        case "numero-asc":
        default:
          return a.mision.numero - b.mision.numero;
      }
    });

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

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      dificultad: "",
      estrellas: "",
      orden: "numero-asc",
    });
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
        Progreso de {studentData.nombre} {studentData.apellido}
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
            {/* --- FILTROS --- */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <DatePicker
                label="Fecha Desde"
                value={
                  filters.fechaDesde
                    ? new Date(filters.fechaDesde + "T00:00:00")
                    : null
                }
                maxDate={
                  filters.fechaHasta
                    ? new Date(filters.fechaHasta + "T00:00:00")
                    : undefined
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
                label="Fecha Hasta"
                value={
                  filters.fechaHasta
                    ? new Date(filters.fechaHasta + "T00:00:00")
                    : null
                }
                minDate={
                  filters.fechaDesde
                    ? new Date(filters.fechaDesde + "T00:00:00")
                    : undefined
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
                  <MenuItem value={dificultad_mision.Dificil}>Difícil</MenuItem>
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
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  name="orden"
                  value={filters.orden}
                  label="Ordenar por"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="numero-asc">Por defecto</MenuItem>
                  <MenuItem value="recientes">Más recientes</MenuItem>
                  <MenuItem value="antiguas">Más antiguas</MenuItem>
                  <MenuItem value="estrellas-desc">Estrellas (Desc.)</MenuItem>
                  <MenuItem value="estrellas-asc">Estrellas (Asc.)</MenuItem>
                  <MenuItem value="intentos-desc">Intentos (Desc.)</MenuItem>
                  <MenuItem value="intentos-asc">Intentos (Asc.)</MenuItem>
                  <MenuItem value="exp-desc">Experiencia (Desc.)</MenuItem>
                  <MenuItem value="exp-asc">Experiencia (Asc.)</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Limpiar filtros">
                <IconButton
                  onClick={handleClearFilters}
                  size="small"
                  color="primary"
                >
                  <FilterAltOff />
                </IconButton>
              </Tooltip>
            </Stack>
            {/* --- SECCIÓN 1: CAMPAÑA --- */}
            <Stack spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                color="primary.main"
              >
                <SportsEsports fontSize="large" />
                <Typography
                  variant="overline"
                  fontWeight="bold"
                  fontSize={16}
                  align="center"
                >
                  Misiones de Campaña
                </Typography>
              </Stack>

              {normalMissions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4 }}>
                  Este alumno no tiene misiones de campaña completadas.
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {filteredMissions.map((m) => (
                    <Grid size={{ sm: 12, md: 6 }} key={m.mision.id}>
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
                <Typography
                  variant="overline"
                  fontWeight="bold"
                  fontSize={16}
                  color="#9c27b0"
                >
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
                      size={{ sm: 12, md: 6 }}
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
