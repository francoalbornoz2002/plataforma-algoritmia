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
  LinearProgress,
  Divider,
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
import { getGameDownload } from "../game/services/game.service";
import DashboardTextCard from "./components/DashboardTextCard";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import DashboardStatCard from "./components/DashboardStatCard";

// --- Componente Auxiliar Visual ---
const ProgressItem = ({
  title,
  percent,
  color,
  valueText,
}: {
  title: string;
  percent: number;
  color:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit";
  valueText: string;
}) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary" fontWeight="medium">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="bold">
        {valueText}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={percent}
      color={color}
      sx={{ height: 8, borderRadius: 4 }}
    />
  </Box>
);

const formatClassTime = (inicio: string, fin: string) => {
  const start = new Date(inicio);
  const end = new Date(fin);
  const dd = String(start.getDate()).padStart(2, "0");
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const yy = String(start.getFullYear()).slice(-2);
  const startHHmm = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endHHmm = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dd}/${mm}/${yy} de ${startHHmm} a ${endHHmm}`;
};

export default function AlumnoDashboardPage() {
  const { profile } = useAuth();
  const { selectedCourse } = useCourseContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownloadGame = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await getGameDownload();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "algoritmia-game.zip");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading game:", error);
      setError(
        error.response?.data?.message || "Error al descargar el videojuego.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

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
    <Stack spacing={3}>
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
          startIcon={
            isDownloading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <VideogameAsset />
            )
          }
          onClick={handleDownloadGame}
          disabled={isDownloading}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          {isDownloading ? "Descargando..." : "Descargar Videojuego"}
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
        {/* LADO IZQUIERDO: INFO DEL CURSO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CourseInfoCard
            course={selectedCourse}
            studentCount={selectedCourse._count?.alumnos || 0}
            isReadOnly={true}
          />
        </Grid>

        {/* LADO DERECHO: RENDIMIENTO Y ESTADÍSTICAS */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* 1. GAUGE Y MISIONES */}
          <Grid container spacing={2} sx={{ height: "100%" }}>
            <Grid size={{ xs: 6 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderTop: "4px solid",
                  borderColor: "success.main",
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Assessment color="success" sx={{ mr: 1 }} />
                  <Typography
                    variant="h6"
                    color="success.main"
                    fontWeight="bold"
                  >
                    Mi Rendimiento
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                  <Gauge
                    value={stats?.progresoPct ?? 0}
                    height={160}
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
                </Box>

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Actividad Reciente
                </Typography>
                <ProgressItem
                  title="Misiones: Hoy vs Semana"
                  percent={
                    stats?.misiones.semana
                      ? (stats.misiones.hoy / stats.misiones.semana) * 100
                      : 0
                  }
                  color="success"
                  valueText={`${stats?.misiones.hoy ?? 0} / ${stats?.misiones.semana ?? 0}`}
                />
              </Paper>
            </Grid>
            {/* 2. DIFICULTADES Y CONSULTAS (Dividido en dos) */}
            <Grid size={{ xs: 6 }}>
              <Stack
                spacing={3}
                justifyContent="space-between"
                sx={{ height: "100%" }}
              >
                <DashboardStatCard
                  title="Dificultades"
                  value={String(stats?.dificultades.activas ?? 0)}
                  subtitle={
                    stats?.dificultades.ultimaAlta
                      ? `Alta: ${stats.dificultades.ultimaAlta}`
                      : "Sin estado crítico"
                  }
                  icon={<AssignmentLate />}
                  color="error"
                  small
                />
                <DashboardStatCard
                  title="Consultas"
                  value={String(stats?.totalConsultas ?? 0)}
                  subtitle="Realizadas"
                  icon={<QuestionAnswer />}
                  color="info"
                  small
                />
                {/* 3. PRÓXIMA CLASE (Ancho completo) */}
                <DashboardTextCard
                  title="Próxima Clase de Consulta"
                  value={
                    stats?.proximaClase
                      ? formatClassTime(
                          stats.proximaClase.fechaInicio,
                          stats.proximaClase.fechaFin,
                        )
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
          </Grid>
        </Grid>
      </Grid>
    </Stack>
  );
}
