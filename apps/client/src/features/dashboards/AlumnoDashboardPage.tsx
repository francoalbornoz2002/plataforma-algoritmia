import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp,
  Warning,
  Event,
  PlayCircleFilled,
  MarkUnreadChatAlt,
  SwitchAccessShortcutAdd,
  Gamepad,
  Games,
  VideogameAsset,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { useCourseContext } from "../../context/CourseContext";
import { getStudentDashboardStats } from "../courses/services/courses.service";
import CourseInfoCard from "./components/CourseInfoCard";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";

export default function AlumnoDashboardPage() {
  const { profile } = useAuth();
  const { selectedCourse } = useCourseContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const data = await getStudentDashboardStats(selectedCourse.id);
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar tus estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedCourse]);

  if (!selectedCourse) {
    return (
      <Alert severity="info">Selecciona un curso para ver tu panel.</Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ height: "100%" }}>
      {/* HEADER */}
      <Paper
        elevation={3}
        sx={{ p: 3, borderLeft: "4px solid", borderColor: "primary.main" }}
      >
        <Typography variant="h4" gutterBottom>
          ¡Hola, {profile?.nombre}! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido a <strong>{selectedCourse.nombre}</strong>
        </Typography>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {/* --- COLUMNA IZQUIERDA (Principal) --- */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={3}>
            {/* 1. INFO DEL CURSO */}
            <CourseInfoCard
              course={selectedCourse}
              studentCount={selectedCourse._count?.alumnos || 0}
              isReadOnly={true}
            />

            {/* 2. ALERTA DE SESIÓN PENDIENTE */}
            {stats?.sesionPendiente && (
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  bgcolor: "warning.light",
                  color: "warning.contrastText",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "anchor-center" }}>
                  <Warning sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      ¡Tienes una Sesión de Refuerzo Pendiente!
                    </Typography>
                    <Typography variant="body2">
                      Vence el:{" "}
                      {new Date(
                        stats.sesionPendiente.fechaHoraLimite,
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PlayCircleFilled />}
                  onClick={() => navigate("/my/sessions")}
                >
                  Resolver Ahora
                </Button>
              </Paper>
            )}

            {/* 3. ESTADÍSTICAS */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DashboardStatCard
                  title="Misiones completadas hoy"
                  value={stats?.misiones.hoy ?? 0}
                  subtitle="Completadas hoy"
                  icon={<TrendingUp />}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DashboardStatCard
                  title="Misiones completadas en la semana"
                  value={stats?.misiones.semana ?? 0}
                  subtitle="Completadas esta semana"
                  icon={<TrendingUp />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DashboardTextCard
                  title="Próxima Clase de Consulta"
                  value={
                    stats?.proximaClase
                      ? new Date(
                          stats.proximaClase.fechaInicio,
                        ).toLocaleString()
                      : "No hay clases programadas"
                  }
                  description={
                    stats?.proximaClase
                      ? `Modalidad: ${stats.proximaClase.modalidad}`
                      : "Estate atento a las próximas clases"
                  }
                  icon={<Event />}
                  color="info"
                />
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        {/* --- COLUMNA DERECHA (Acciones) --- */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom color="primary">
              Acciones Rápidas
            </Typography>
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<VideogameAsset />}
                onClick={() => navigate("/my/download-game")}
                sx={{ justifyContent: "flex-start" }}
              >
                Descargar Videojuego
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => navigate("/my/progress")}
                sx={{ justifyContent: "flex-start" }}
              >
                Ver mi Progreso
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Warning />}
                onClick={() => navigate("/my/difficulties")}
                sx={{ justifyContent: "flex-start" }}
              >
                Ver mis Dificultades
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SwitchAccessShortcutAdd />}
                onClick={() => navigate("/my/sessions")}
                sx={{ justifyContent: "flex-start" }}
              >
                Ver mis Sesiones
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MarkUnreadChatAlt />}
                onClick={() => navigate("/my/consults")}
                sx={{ justifyContent: "flex-start" }}
              >
                Realizar Consulta
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Event />}
                onClick={() => navigate("/my/consult-classes")}
                sx={{ justifyContent: "flex-start" }}
              >
                Clases de Consulta
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
