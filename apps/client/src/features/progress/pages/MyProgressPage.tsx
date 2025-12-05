import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { getMyProgress } from "../../users/services/alumnos.service";

// 2. Tipos
import type { ProgresoAlumno } from "../../../types";
import MissionCard from "../components/MissionCard";
import KpiProgressCard from "../components/KpiProgressCard";

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
      <Typography variant="h5" gutterBottom>
        Mi Progreso en {selectedCourse.nombre}
      </Typography>

      {/* --- Grilla de KPIs --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Progreso Total"
            value={
              progress ? `${progress.pctMisionesCompletadas.toFixed(1)}%` : 0
            }
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Estrellas (Prom.)"
            value={progress ? progress.promEstrellas.toFixed(1) : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Intentos (Prom.)"
            value={progress ? progress.promIntentos.toFixed(1) : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="EXP Total"
            value={progress ? progress.totalExp : 0}
            loading={isLoading}
          />
        </Grid>

        {/* --- Fila 2 de KPIs --- */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Misiones Completadas"
            value={progress ? progress.cantMisionesCompletadas : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Estrellas Totales"
            value={progress ? progress.totalEstrellas : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Intentos Totales"
            value={progress ? progress.totalIntentos : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiProgressCard
            title="Última Actividad"
            value={ultimaActividadFormateada}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

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
