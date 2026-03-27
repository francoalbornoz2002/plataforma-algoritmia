import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Alert,
  Paper,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { ar, es } from "date-fns/locale";
import StarIcon from "@mui/icons-material/Star";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

// 1. Hooks y Servicios
import { format } from "date-fns";
import { useCourseContext } from "../../../context/CourseContext";
import {
  getMyProgress,
  getMyMissions,
} from "../../users/services/alumnos.service";

// 2. Tipos
import {
  type ProgresoAlumno,
  type MisionConEstado,
  dificultad_mision,
} from "../../../types";
import MissionCard from "../components/MissionCard";
import DashboardStatCard from "../../dashboards/components/DashboardStatCard";
import DashboardTextCard from "../../dashboards/components/DashboardTextCard";
import { Assessment } from "@mui/icons-material";
import HeaderPage from "client/src/components/HeaderPage";
import { datePickerConfig } from "../../../config/theme.config";

export default function MyProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---
  const [progress, setProgress] = useState<ProgresoAlumno | null>(null);
  const [missions, setMissions] = useState<MisionConEstado[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
    dificultad: "",
    estado: "",
    estrellas: "",
    orden: "numero-asc",
  });
  const [filteredMissions, setFilteredMissions] = useState<MisionConEstado[]>(
    [],
  );

  const [error, setError] = useState<string | null>(null);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    Promise.all([
      getMyProgress(selectedCourse.id),
      getMyMissions(selectedCourse.id),
    ])
      .then(([progressData, missionsData]) => {
        setProgress(progressData);
        setMissions(missionsData);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  useEffect(() => {
    let result = [...missions];

    if (filters.fechaDesde) {
      result = result.filter(
        (m) =>
          m.completada?.fechaCompletado &&
          new Date(m.completada.fechaCompletado) >=
            new Date(filters.fechaDesde + "T00:00:00"),
      );
    }

    if (filters.fechaHasta) {
      result = result.filter(
        (m) =>
          m.completada?.fechaCompletado &&
          new Date(m.completada.fechaCompletado) <=
            new Date(filters.fechaHasta + "T23:59:59"),
      );
    }

    if (filters.dificultad) {
      result = result.filter(
        (m) => m.mision.dificultadMision === filters.dificultad,
      );
    }

    if (filters.estado) {
      result = result.filter((m) =>
        filters.estado === "completada" ? m.completada : !m.completada,
      );
    }

    if (filters.estrellas) {
      result = result.filter(
        (m) => m.completada?.estrellas === Number(filters.estrellas),
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      switch (filters.orden) {
        case "recientes": {
          const dateA = a.completada?.fechaCompletado
            ? new Date(a.completada.fechaCompletado).getTime()
            : 0;
          const dateB = b.completada?.fechaCompletado
            ? new Date(b.completada.fechaCompletado).getTime()
            : 0;
          return dateB - dateA;
        }
        case "antiguas": {
          const dateA = a.completada?.fechaCompletado
            ? new Date(a.completada.fechaCompletado).getTime()
            : Infinity;
          const dateB = b.completada?.fechaCompletado
            ? new Date(b.completada.fechaCompletado).getTime()
            : Infinity;
          return dateA - dateB;
        }
        case "estrellas-desc":
          return (
            (b.completada?.estrellas || -1) - (a.completada?.estrellas || -1)
          );
        case "estrellas-asc":
          return (
            (a.completada?.estrellas ?? Infinity) -
            (b.completada?.estrellas ?? Infinity)
          );
        case "intentos-desc":
          return (
            (b.completada?.intentos || -1) - (a.completada?.intentos || -1)
          );
        case "intentos-asc":
          return (
            (a.completada?.intentos ?? Infinity) -
            (b.completada?.intentos ?? Infinity)
          );
        case "exp-desc":
          return (b.completada?.exp || -1) - (a.completada?.exp || -1);
        case "exp-asc":
          return (
            (a.completada?.exp ?? Infinity) - (b.completada?.exp ?? Infinity)
          );
        case "numero-asc":
        default:
          return (a.mision.numero || 0) - (b.mision.numero || 0);
      }
    });

    setFilteredMissions(result);
  }, [filters, missions]);

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
      estado: "",
      estrellas: "",
      orden: "numero-asc",
    });
  };

  // --- 4. RENDERIZADO ---

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver tu progreso.
      </Alert>
    );
  }

  const isLoading = loading;

  const TOTAL_MISIONES = missions.length;
  const TOTAL_ESTRELLAS = TOTAL_MISIONES * 3;

  // Formateamos el valor de "Última Actividad"
  const ultimaActividadFormateada = progress?.ultimaActividad
    ? `${formatDistanceToNow(new Date(progress.ultimaActividad), {
        locale: es,
      })}`
    : "Nunca";

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : progress ? (
        <Stack spacing={2} sx={{ height: "100%", minWidth: 0 }}>
          <HeaderPage
            title={`Mi Progreso en ${selectedCourse.nombre}`}
            description="Consulta tu avance y estadísticas de progreso en el curso"
            icon={<Assessment />}
            color="primary"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 2 }}>
              <DashboardStatCard
                title="Misiones Completadas"
                subtitle="Acumuladas en el curso"
                value={`${progress.cantMisionesCompletadas} / ${TOTAL_MISIONES}`}
                icon={<TaskAltIcon />}
                color="success"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 2 }}>
              <DashboardStatCard
                title="Estrellas Totales"
                subtitle="Acumuladas en el curso"
                value={`${progress.totalEstrellas} / ${TOTAL_ESTRELLAS}`}
                icon={<StarIcon />}
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <DashboardStatCard
                title="Experiencia Total"
                subtitle="Acumuladas en el curso"
                value={progress.totalExp}
                icon={<BoltIcon />}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1.8 }}>
              <DashboardStatCard
                title="Prom. Estrellas"
                value={progress.promEstrellas.toFixed(1)}
                icon={<StarIcon />}
                color="warning"
                subtitle="Por misión"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1.8 }}>
              <DashboardStatCard
                title="Prom. Intentos"
                value={progress.promIntentos.toFixed(1)}
                icon={<ReplayIcon />}
                color="info"
                subtitle="Por misión"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2.4 }}>
              <DashboardTextCard
                title="Última Actividad"
                description="Completando una misión"
                value={ultimaActividadFormateada}
                icon={<AccessTimeIcon />}
                color="info"
              />
            </Grid>
          </Grid>

          {/* --- SECCIÓN 1: MISIONES DE CAMPAÑA (Normales) --- */}
          <Stack spacing={2}>
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
                minDate={
                  filters.fechaDesde
                    ? new Date(filters.fechaDesde + "T00:00:00")
                    : undefined
                }
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
                  <MenuItem value={dificultad_mision.Dificil}>Difícil</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={filters.estado}
                  label="Estado"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
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
              <FormControl size="small" sx={{ width: 190 }}>
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
                  <FilterAltOffIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                color="primary.main"
              >
                <SportsEsportsIcon fontSize="large" />
                <Typography
                  variant="overline"
                  fontWeight="bold"
                  fontSize={16}
                  align="center"
                >
                  Misiones de Campaña
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {filteredMissions.map((m) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.mision.id}>
                    <MissionCard missionData={m} />
                  </Grid>
                ))}
                {filteredMissions.length === 0 && missions.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ width: "100%" }}>
                      No se encontraron misiones con los filtros aplicados.
                    </Alert>
                  </Grid>
                )}
                {missions.length === 0 && !loading && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ width: "100%" }}>
                      No hay misiones de campaña en este curso.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </Stack>

          {/* --- SECCIÓN 2: MISIONES ESPECIALES --- */}
          <Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              color="primary.main"
            >
              <AutoAwesomeIcon fontSize="large" sx={{ color: "#9c27b0" }} />
              <Typography
                variant="overline"
                fontWeight="bold"
                fontSize={16}
                color="#9c27b0"
              >
                Misiones Especiales
              </Typography>
            </Stack>
            <Divider sx={{ mt: 1, mb: 2 }} />

            <Grid container spacing={2}>
              {progress.misionesEspeciales?.map((m) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.id}>
                  <MissionCard missionData={m} />
                </Grid>
              ))}
              {!progress.misionesEspeciales?.length && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    No tienes misiones especiales registradas.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Stack>
        </Stack>
      ) : null}
    </Box>
  );
}
