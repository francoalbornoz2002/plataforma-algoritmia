import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Stack,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import PercentIcon from "@mui/icons-material/Percent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { getMyProgress } from "../../users/services/alumnos.service";

// 2. Tipos
import type { ProgresoAlumno } from "../../../types";
import MissionCard from "../components/MissionCard";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

export default function MyProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---
  const [progress, setProgress] = useState<ProgresoAlumno | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [errorProgress, setErrorProgress] = useState<string | null>(null);

  //const [missions, setMissions] = useState<MisionConEstado[]>([]);
  //const [loadingMissions, setLoadingMissions] = useState(true);
  //const [errorMissions, setErrorMissions] = useState<string | null>(null);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    if (!selectedCourse) return;

    setLoadingProgress(true);
    // Solo llamamos a getMyProgress
    getMyProgress(selectedCourse.id)
      .then((data) => setProgress(data))
      .catch((err) => setErrorProgress(err.message))
      .finally(() => setLoadingProgress(false));
  }, [selectedCourse]);

  // --- 4. RENDERIZADO ---

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver tu progreso.
      </Alert>
    );
  }

  const isLoading = loadingProgress;

  // Formateamos el valor de "Última Actividad"
  const ultimaActividadFormateada = progress?.ultimaActividad
    ? `hace ${formatDistanceToNow(new Date(progress.ultimaActividad), {
        locale: es,
        addSuffix: false,
      })}`
    : "Nunca";

  return (
    <Box>
      {isLoading ? (
        <CircularProgress sx={{ mb: 3 }} />
      ) : progress ? (
        <Paper elevation={5} component="section" sx={{ p: 2, mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
          >
            Mi Progreso en {selectedCourse.nombre}
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            {/* KPIs */}
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PercentIcon color="success" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Progreso Total
                      </Typography>
                    </Stack>
                    <Typography
                      variant="h3"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      {progress.pctMisionesCompletadas.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TaskAltIcon color="info" fontSize="small" />
                        <Typography variant="caption" display="block">
                          Misiones Completadas
                        </Typography>
                      </Stack>
                      <Typography variant="h6">
                        {progress.cantMisionesCompletadas}
                      </Typography>
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon color="action" fontSize="small" />
                        <Typography variant="caption" display="block">
                          Última Actividad
                        </Typography>
                      </Stack>
                      <Typography variant="h6">
                        {ultimaActividadFormateada}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon color="warning" fontSize="small" />
                        <Typography variant="caption" display="block">
                          Estrellas
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight="bold">
                        {progress.totalEstrellas}
                      </Typography>
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <BoltIcon color="primary" fontSize="small" />
                        <Typography variant="caption" display="block">
                          Exp Total
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight="bold">
                        {progress.totalExp}
                      </Typography>
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ReplayIcon color="action" fontSize="small" />
                        <Typography variant="caption" display="block">
                          Intentos
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight="bold">
                        {progress.totalIntentos}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Mis Promedios
                    </Typography>
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <StarIcon color="warning" fontSize="inherit" />
                          <Typography variant="caption">Estrellas</Typography>
                        </Stack>
                        <Typography variant="h6" color="warning.main">
                          {progress.promEstrellas.toFixed(1)}
                        </Typography>
                      </Box>
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <ReplayIcon color="info" fontSize="inherit" />
                          <Typography variant="caption">Intentos</Typography>
                        </Stack>
                        <Typography variant="h6" color="info.main">
                          {progress.promIntentos.toFixed(1)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
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
      ) : null}

      <Divider sx={{ mb: 4 }} />

      {/* --- SECCIÓN 1: MISIONES DE CAMPAÑA (Normales) --- */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        🎮 Misiones de Campaña
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
          {progress?.misionesCompletadas?.map((m) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.idMision}>
              {/* Pasamos el objeto directamente, MissionCard lo detectará como Caso C */}
              <MissionCard missionData={m} />
            </Grid>
          ))}
          {!progress?.misionesCompletadas?.length && (
            <Alert severity="info" sx={{ width: "100%" }}>
              No hay misiones completadas aún.
            </Alert>
          )}
        </Grid>
      )}
      {/* --- SECCIÓN 2: MISIONES ESPECIALES --- */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1, color: "purple" }}
      >
        🌟 Misiones Especiales
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {progress?.misionesEspeciales?.map((m) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.id}>
              {/* Pasamos el objeto, MissionCard lo detectará como Caso A */}
              <MissionCard missionData={m} />
            </Grid>
          ))}
          {!progress?.misionesEspeciales?.length && (
            <Alert
              severity="info"
              sx={{ width: "100%", bgcolor: "#f3e5f5", color: "#6a1b9a" }}
            >
              No tienes misiones especiales registradas.
            </Alert>
          )}
        </Grid>
      )}
    </Box>
  );
}
