import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import {
  getMyProgress,
  getMyMissions,
} from "../../users/services/alumnos.service";

// 2. Tipos
import type { ProgresoAlumno, MisionConEstado } from "../../../types";
import MissionCard from "../components/MissionCard";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import DashboardStatCard from "../../dashboards/components/DashboardStatCard";
import DashboardTextCard from "../../dashboards/components/DashboardTextCard";
import { Assessment } from "@mui/icons-material";
import HeaderPage from "client/src/components/HeaderPage";

export default function MyProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---
  const [progress, setProgress] = useState<ProgresoAlumno | null>(null);
  const [missions, setMissions] = useState<MisionConEstado[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  // --- 4. RENDERIZADO ---

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver tu progreso.
      </Alert>
    );
  }

  const isLoading = loading;

  // Formateamos el valor de "Última Actividad"
  const ultimaActividadFormateada = progress?.ultimaActividad
    ? `hace ${formatDistanceToNow(new Date(progress.ultimaActividad), {
        locale: es,
        addSuffix: false,
      })}`
    : "Nunca";

  return (
    <Box sx={{ width: "100%" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : progress ? (
        <Stack spacing={3} sx={{ pb: 4 }}>
          <HeaderPage
            title={`Mi Progreso en ${selectedCourse.nombre}`}
            description="Consulta tu avance y estadísticas de progreso en el curso"
            icon={<Assessment />}
            color="primary"
          />
          <Paper elevation={2} component="section" sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              {/* KPIs */}
              <Box sx={{ flex: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardStatCard
                      title="Misiones Completadas"
                      value={progress.cantMisionesCompletadas}
                      icon={<TaskAltIcon />}
                      color="success"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardTextCard
                      title="Última Actividad"
                      value={ultimaActividadFormateada}
                      icon={<AccessTimeIcon />}
                      color="info"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardStatCard
                      title="Estrellas Totales"
                      value={progress.totalEstrellas}
                      icon={<StarIcon />}
                      color="warning"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardStatCard
                      title="Experiencia Total"
                      value={progress.totalExp}
                      icon={<BoltIcon />}
                      color="primary"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardStatCard
                      title="Promedio Estrellas"
                      value={progress.promEstrellas.toFixed(1)}
                      icon={<StarIcon />}
                      color="warning"
                      subtitle="Por misión"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DashboardStatCard
                      title="Promedio Intentos"
                      value={progress.promIntentos.toFixed(1)}
                      icon={<ReplayIcon />}
                      color="info"
                      subtitle="Por misión"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Gráfico */}
              <Box sx={{ flex: 1, minHeight: 300 }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Gráfico de mi progreso
                  </Typography>
                  <Gauge
                    value={progress.pctMisionesCompletadas}
                    cornerRadius="50%"
                    sx={{
                      [`& .${gaugeClasses.valueText}`]: {
                        fontSize: 35,
                        fontWeight: "bold",
                      },
                      [`& .${gaugeClasses.valueArc}`]: {
                        fill: "#4caf50",
                      },
                    }}
                    text={({ value }) => `${value?.toFixed(1)}%`}
                    height={250}
                  />
                </Paper>
              </Box>
            </Stack>
          </Paper>

          {/* --- SECCIÓN 1: MISIONES DE CAMPAÑA (Normales) --- */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Box sx={{ color: "primary.main", display: "flex" }}>
                <SportsEsportsIcon fontSize="large" />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                Misiones de Campaña
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {missions.map((m) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.mision.id}>
                  <MissionCard missionData={m} />
                </Grid>
              ))}
              {!missions.length && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ width: "100%" }}>
                    No hay misiones completadas aún.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* --- SECCIÓN 2: MISIONES ESPECIALES --- */}
          <Paper elevation={2} sx={{ p: 3, borderLeft: "6px solid #9c27b0" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Box sx={{ color: "secondary.main", display: "flex" }}>
                <AutoAwesomeIcon fontSize="large" />
              </Box>
              <Typography variant="h6" fontWeight="bold" color="secondary.main">
                Misiones Especiales
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {progress.misionesEspeciales?.map((m) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.id}>
                  <MissionCard missionData={m} />
                </Grid>
              ))}
              {!progress.misionesEspeciales?.length && (
                <Grid size={{ xs: 12 }}>
                  <Alert
                    severity="info"
                    sx={{
                      width: "100%",
                      bgcolor: "#f3e5f5",
                      color: "#6a1b9a",
                    }}
                  >
                    No tienes misiones especiales registradas.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Stack>
      ) : null}
    </Box>
  );
}
