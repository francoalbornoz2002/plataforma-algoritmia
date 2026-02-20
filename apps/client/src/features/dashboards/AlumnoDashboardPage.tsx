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
  VideogameAsset,
  Assessment,
  AssignmentLate,
  QuestionAnswer,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { useCourseContext } from "../../context/CourseContext";
import { getStudentDashboardStats } from "../courses/services/courses.service";
import CourseInfoCard from "./components/CourseInfoCard";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

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
        sx={{ p: 2, borderLeft: "4px solid", borderColor: "primary.main" }}
      >
        <Stack spacing={1}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            ¡Hola, {profile?.nombre}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bienvenido al panel de control de:{" "}
            <strong>{selectedCourse.nombre}</strong>. Estas son algunas acciones
            rápidas que puedes realizar:
          </Typography>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2} direction="row">
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<VideogameAsset />}
          onClick={() => navigate("/my/download-game")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Descargar Videojuego
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="success"
          startIcon={<Assessment />}
          onClick={() => navigate("/my/progress")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver mi Progreso
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<AssignmentLate />}
          onClick={() => navigate("/my/difficulties")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver mis Dificultades
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SwitchAccessShortcutAdd />}
          onClick={() => navigate("/my/sessions")}
          sx={{
            justifyContent: "flex-start",
            color: "#9c27b0",
            borderColor: "#9c27b0",
            bgcolor: "background.paper",
          }}
        >
          Ver mis Sesiones
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="info"
          startIcon={<MarkUnreadChatAlt />}
          onClick={() => navigate("/my/consults")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Realizar Consulta
        </Button>
      </Stack>

      {/* 2. ALERTA DE SESIÓN PENDIENTE (Compacta) */}
      {stats?.sesionPendiente && (
        <Alert
          severity="warning"
          variant="standard"
          icon={<Warning />}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<PlayCircleFilled />}
              onClick={() => navigate("/my/sessions")}
            >
              Resolver
            </Button>
          }
          sx={{ fontWeight: "bold", border: 1, borderColor: "warning.main" }}
        >
          Sesión de refuerzo pendiente:{" "}
          {stats.sesionPendiente.dificultad.nombre} (Vence:{" "}
          {new Date(stats.sesionPendiente.fechaHoraLimite).toLocaleDateString()}
          )
        </Alert>
      )}

      {/* --- COLUMNA IZQUIERDA (Principal) --- */}
      <Grid container spacing={3}>
        {/* 1. INFO DEL CURSO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CourseInfoCard
            course={selectedCourse}
            studentCount={selectedCourse._count?.alumnos || 0}
            isReadOnly={true}
          />
        </Grid>

        {/* 2. GRÁFICO DE PROGRESO */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderTop: "4px solid",
                borderColor: "success.main",
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="bold"
                gutterBottom
              >
                Mi Progreso General
              </Typography>
              <Gauge
                value={stats?.progresoPct ?? 0}
                cornerRadius="50%"
                sx={{
                  [`& .${gaugeClasses.valueText}`]: {
                    fontSize: 28,
                    fontWeight: "bold",
                  },
                  [`& .${gaugeClasses.valueArc}`]: {
                    fill: "#4caf50",
                  },
                }}
                text={({ value }) => `${value?.toFixed(1)}%`}
              />
            </Paper>
            {/* 4. PRÓXIMA CLASE */}
            <DashboardTextCard
              title="Próxima Clase de Consulta"
              value={
                stats?.proximaClase
                  ? new Date(stats.proximaClase.fechaInicio).toLocaleString()
                  : "No hay clases programadas"
              }
              description={
                stats?.proximaClase
                  ? `Modalidad: ${stats.proximaClase.modalidad}`
                  : "Estate atento a las próximas clases"
              }
              icon={<Event />}
              color="primary"
            />
          </Stack>
        </Grid>
        {/* 3. ESTADÍSTICAS UNIFICADAS Y NUEVAS */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={2}>
            <DashboardStatCard
              title="Misiones Completadas"
              value={`${stats?.misiones.hoy ?? 0} / ${stats?.misiones.semana ?? 0}`}
              subtitle="Hoy vs. Esta semana"
              icon={<TrendingUp />}
              color="success"
              week
            />
            <DashboardStatCard
              title="Dificultades Activas"
              value={stats?.dificultades.activas ?? 0}
              subtitle={
                stats?.dificultades.ultimaAlta
                  ? `Última alta: ${stats.dificultades.ultimaAlta}`
                  : "Sin dificultades críticas"
              }
              icon={<AssignmentLate />}
              color="error"
            />
            <DashboardStatCard
              title="Consultas Realizadas"
              value={stats?.totalConsultas ?? 0}
              subtitle="Total acumulado"
              icon={<QuestionAnswer />}
              color="info"
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
