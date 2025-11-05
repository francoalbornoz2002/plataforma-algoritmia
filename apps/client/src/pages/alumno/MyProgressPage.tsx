import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// 1. Hooks y Servicios
import { useCourseContext } from "../../context/CourseContext";
import { getMyProgress } from "../../services/alumnos.service";

// 2. Tipos
import type { ProgresoAlumno } from "../../types";

// --- Componente Helper para los KPIs ---
// (Copiado de la ProgressPage del Docente)
interface KpiCardProps {
  title: string;
  value: string | number;
  loading: boolean;
}
function KpiCard({ title, value, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {loading ? <CircularProgress size={30} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );
}
// --- Fin Componente Helper ---

export default function MyProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---
  const [progress, setProgress] = useState<ProgresoAlumno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    // Solo buscamos si hay un curso seleccionado
    if (!selectedCourse) {
      setLoading(false);
      setError(null);
      setProgress(null);
      return;
    }

    setLoading(true);
    setError(null);
    getMyProgress(selectedCourse.id)
      .then((data) => {
        setProgress(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
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
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Estrellas (Prom.)"
            value={progress ? `⭐ ${progress.promEstrellas.toFixed(1)}` : 0}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Intentos (Prom.)"
            value={progress ? progress.promIntentos.toFixed(1) : 0}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="EXP Total"
            value={progress ? progress.totalExp : 0}
            loading={loading}
          />
        </Grid>

        {/* --- Fila 2 de KPIs --- */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Misiones Completadas"
            value={progress ? progress.cantMisionesCompletadas : 0}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Estrellas Totales"
            value={progress ? progress.totalEstrellas : 0}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Intentos Totales"
            value={progress ? progress.totalIntentos : 0}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Última Actividad"
            value={ultimaActividadFormateada}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* (Aquí podrías añadir más componentes, como un gráfico
         o una lista de las últimas misiones completadas) */}
    </Box>
  );
}
