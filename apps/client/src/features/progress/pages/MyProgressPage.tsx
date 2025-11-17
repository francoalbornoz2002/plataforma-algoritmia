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
import {
  getMyMissions,
  getMyProgress,
} from "../../users/services/alumnos.service";

// 2. Tipos
import type { MisionConEstado, ProgresoAlumno } from "../../../types";
import MissionCard from "../components/MissionCard";
import KpiCard from "../components/KpiCard";

export default function MyProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---
  const [progress, setProgress] = useState<ProgresoAlumno | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [errorProgress, setErrorProgress] = useState<string | null>(null);

  const [missions, setMissions] = useState<MisionConEstado[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [errorMissions, setErrorMissions] = useState<string | null>(null);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    // Solo buscamos si hay un curso seleccionado
    if (!selectedCourse) {
      setLoadingProgress(false);
      setLoadingMissions(false);
      setErrorProgress(null);
      setErrorMissions(null);
      setProgress(null);
      setMissions([]);
      return;
    }

    // --- Fetch 1: KPIs de Progreso ---
    setLoadingProgress(true);
    setErrorProgress(null);
    getMyProgress(selectedCourse.id)
      .then((data) => {
        setProgress(data);
      })
      .catch((err) => {
        setErrorProgress(err.message);
      })
      .finally(() => {
        setLoadingProgress(false);
      });

    // --- Fetch 2: Lista de Misiones ---
    setLoadingMissions(true);
    setErrorMissions(null);
    getMyMissions(selectedCourse.id)
      .then((data) => {
        setMissions(data);
      })
      .catch((err) => {
        setErrorMissions(err.message);
      })
      .finally(() => {
        setLoadingMissions(false);
      });
  }, [selectedCourse]); // Se re-ejecuta cada vez que el curso cambia

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
      <Typography variant="h4" gutterBottom>
        Mi Progreso en {selectedCourse.nombre}
      </Typography>

      {/* --- Grilla de KPIs --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Progreso Total"
            value={
              progress ? `${progress.pctMisionesCompletadas.toFixed(1)}%` : 0
            }
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Estrellas (Prom.)"
            value={progress ? progress.promEstrellas.toFixed(1) : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Intentos (Prom.)"
            value={progress ? progress.promIntentos.toFixed(1) : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="EXP Total"
            value={progress ? progress.totalExp : 0}
            loading={isLoading}
          />
        </Grid>

        {/* --- Fila 2 de KPIs --- */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Misiones Completadas"
            value={progress ? progress.cantMisionesCompletadas : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Estrellas Totales"
            value={progress ? progress.totalEstrellas : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Intentos Totales"
            value={progress ? progress.totalIntentos : 0}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Última Actividad"
            value={ultimaActividadFormateada}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* --- B. Grilla de Misiones --- */}
      <Typography variant="h4" gutterBottom>
        Estado de Misiones
      </Typography>

      {loadingMissions ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : errorMissions ? (
        <Alert severity="error">{errorMissions}</Alert>
      ) : missions.length === 0 ? (
        <Alert severity="info">
          Aún no hay misiones cargadas para este curso.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {missions.map((missionData) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={missionData.mision.id}>
              <MissionCard missionData={missionData} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
