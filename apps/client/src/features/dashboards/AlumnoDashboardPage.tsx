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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Warning,
  Event,
  PlayCircleFilled,
  MarkUnreadChatAlt,
  SwitchAccessShortcutAdd,
  VideogameAsset,
  Assessment,
  AssignmentLate,
  CheckCircle,
  NotificationsActive,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { useCourseContext } from "../../context/CourseContext";
import { getStudentDashboardStats } from "../courses/services/courses.service";
import CourseInfoCard from "./components/CourseInfoCard";
import { getGameDownload } from "../game/services/game.service";
import DashboardTextCard from "./components/DashboardTextCard";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import {
  estado_consulta,
  estado_sesion,
  type StudentDashboardStats,
} from "../../types";
import {
  EstadoConsultaLabels,
  EstadoSesionLabels,
} from "../../types/traducciones";
import ReportTextualCard from "../reports/components/common/ReportTextualCard";

// --- Componentes Auxiliares Visuales ---

const DistributionBar = ({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) => {
  const total = items.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Sin datos
      </Typography>
    );

  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: 16,
          borderRadius: 2,
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              width: `${(item.value / total) * 100}%`,
              bgcolor: item.color,
            }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ rowGap: 1 }}
      >
        {items.map((item, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: item.color,
                mr: 1,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight="medium"
            >
              {item.label}: {item.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const getDificultadColor = (label: string) => {
  if (label === "Bajo") return "#4caf50";
  if (label === "Medio") return "#ff9800";
  if (label === "Alto") return "#f44336";
  if (label === "Ninguno") return "#9e9e9e"; // Gris para superadas
  return "#9e9e9e";
};

const getEstadoConsultaColor = (estado: string) => {
  const map: Record<string, string> = {
    Pendiente: "#ff9800",
    Resuelta: "#4caf50",
    No_resuelta: "#f44336",
    A_revisar: "#03a9f4",
    Revisada: "#9c27b0",
  };
  return map[estado] || "#9e9e9e";
};

const getEstadoSesionColor = (estado: string) => {
  const map: Record<string, string> = {
    Pendiente: "#ff9800",
    Completada: "#4caf50",
    Cancelada: "#f44336",
    En_curso: "#03a9f4",
    Incompleta: "#9c27b0",
    No_realizada: "#9e9e9e",
  };
  return map[estado] || "#9e9e9e";
};

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

  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
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

  // Calculamos la descripción dinámica de la misión más difícil
  let descMision = "Ninguna completada en la semana";
  if (stats?.misionMasDificil) {
    const { intentos, promedioHistorial } = stats.misionMasDificil;
    if (promedioHistorial > 0 && intentos > promedioHistorial) {
      const diff = ((intentos - promedioHistorial) / promedioHistorial) * 100;
      descMision = `Tomó ${intentos} intentos (+${diff.toFixed(0)}% vs tu promedio)`;
    } else {
      descMision = `Tomó ${intentos} intentos`;
    }
  }

  // --- Lógica para la tarjeta de Última Sesión Completada ---
  let sesionTitle = "No has completado ninguna sesión.";
  let sesionDescription = "No has completado ninguna sesión.";
  let sesionValue = "N/A";
  let sesionColor: "info" | "success" | "error" | "warning" = "info";

  if (stats?.sesiones.ultimoResultado) {
    const {
      nroSesion,
      dificultadNombre,
      pctAciertos,
      gradoAnterior,
      gradoNuevo,
    } = stats.sesiones.ultimoResultado;

    sesionTitle = `Última Sesión Completada: Sesión N°${nroSesion} - ${dificultadNombre}`;

    sesionDescription = `Obtuviste un porcentaje de aciertos de ${Math.round(
      pctAciertos,
    )}%.`;

    const gradoAnteriorDisplay =
      gradoAnterior === "Ninguno" ? "N/A" : gradoAnterior;
    const gradoNuevoDisplay =
      gradoNuevo === "Ninguno" ? "Superado" : gradoNuevo;
    sesionValue = `${gradoAnteriorDisplay} ➔ ${gradoNuevoDisplay}`;

    const weights: Record<string, number> = {
      Ninguno: 0,
      Bajo: 1,
      Medio: 2,
      Alto: 3,
    };
    const wOld = weights[gradoAnterior] || 0;
    const wNew = weights[gradoNuevo] || 0;

    if (wNew < wOld || gradoNuevo === "Ninguno") {
      sesionColor = "success";
    } else if (wNew > wOld) {
      sesionColor = "error";
    } else {
      sesionColor = "warning";
    }
  }

  // --- Lógica para la tarjeta de Última Consulta Realizada (la última que el alumno hizo) ---
  const ultimaConsultaTitle = "Última consulta realizada";
  let ultimaConsultaDescription = "No has realizado ninguna consulta.";
  let ultimaConsultaValue = "N/A";
  const ultimaConsultaColor: "info" = "info";

  if (stats?.consultas.ultimaRealizada) {
    const originalDescription = stats.consultas.ultimaRealizada.descripcion;
    ultimaConsultaDescription =
      originalDescription.length > 99
        ? originalDescription.substring(0, 99) + "..."
        : originalDescription;
    ultimaConsultaValue = stats.consultas.ultimaRealizada.titulo;
  }

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

      <Grid container spacing={3}>
        {/* ROW 1: INFO DEL CURSO Y TAREAS PENDIENTES */}
        <Grid size={{ xs: 12, md: 8 }}>
          <CourseInfoCard
            course={selectedCourse}
            studentCount={stats?.cantidadAlumnosInscriptos || 0}
            isReadOnly={true}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={2}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderTop: "4px solid",
              borderColor: "warning.main",
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
              }}
            >
              <NotificationsActive color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                Actividad y Pendientes
              </Typography>
            </Box>
            <List sx={{ flexGrow: 1, overflowY: "auto", p: 0, maxHeight: 280 }}>
              {stats?.sesionPendiente && (
                <ListItem divider>
                  <ListItemIcon>
                    <SwitchAccessShortcutAdd sx={{ color: "#9c27b0" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Sesión pendiente: ${stats.sesionPendiente.dificultad.nombre}`}
                    secondary={`Vence: ${new Date(stats.sesionPendiente.fechaHoraLimite).toLocaleDateString()}`}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayCircleFilled />}
                    onClick={() => navigate("/my/sessions")}
                    sx={{ backgroundColor: "#9c27b0" }}
                  >
                    Ir
                  </Button>
                </ListItem>
              )}
              {stats?.proximaClase && (
                <ListItem divider>
                  <ListItemIcon>
                    <Event color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Próxima Clase: ${stats.proximaClase.nombre}`}
                    secondary={formatClassTime(
                      stats.proximaClase.fechaInicio,
                      stats.proximaClase.fechaFin,
                    )}
                  />
                </ListItem>
              )}
              {stats?.consultas.recientes.map((c) => (
                <ListItem key={c.id} divider>
                  <ListItemIcon>
                    <CheckCircle color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Consulta revisada"
                    secondary={c.titulo}
                    slotProps={{ secondary: { noWrap: true } }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => navigate("/my/consults")}
                  >
                    Ver
                  </Button>
                </ListItem>
              ))}
              {!stats?.sesionPendiente &&
                !stats?.proximaClase &&
                (!stats?.consultas.recientes ||
                  stats.consultas.recientes.length === 0) && (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No tienes tareas pendientes urgentes. ¡Sigue así!
                    </Typography>
                  </Box>
                )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ROW 2: PROGRESO Y DIFICULTADES */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "success.main",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Assessment color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold">
                Mi Progreso
              </Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid
                size={{ xs: 12, sm: 5 }}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Gauge
                  value={stats?.progresoPct ?? 0}
                  height={220}
                  cornerRadius="50%"
                  text={({ value }) => `${value?.toFixed(1)}%`}
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 28,
                      fontWeight: "bold",
                    },
                    [`& .${gaugeClasses.valueArc}`]: { fill: "#4caf50" },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Actividad Reciente
                </Typography>
                <DistributionBar
                  items={[
                    {
                      label: "Hoy",
                      value: stats?.misiones.hoy ?? 0,
                      color: "#4caf50", // Success
                    },
                    {
                      label: "Resto de la semana",
                      value:
                        (stats?.misiones.semana ?? 0) -
                        (stats?.misiones.hoy ?? 0),
                      color: "#8fd490", // Un color neutro
                    },
                  ]}
                />
                <Divider sx={{ my: 2 }} />
                <DashboardTextCard
                  title="Misión más difícil"
                  description={descMision}
                  value={
                    stats?.misionMasDificil
                      ? `Misión N° ${stats.misionMasDificil.mision.numero}`
                      : "Ninguna"
                  }
                  icon={<Warning />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "error.main",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AssignmentLate color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" color="error.main" fontWeight="bold">
                Mis Dificultades
              </Typography>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Distribución de Dificultades Registradas
            </Typography>
            <DistributionBar
              items={
                stats?.dificultades.distribucion?.map((d) => ({
                  label: d.label === "Ninguno" ? "Superadas" : d.label,
                  value: d.value,
                  color: getDificultadColor(d.label),
                })) ?? []
              }
            />
            <Divider sx={{ my: 2 }} />
            <Grid size={{ xs: 12 }}>
              <ReportTextualCard
                title="Última dificultad en grado alto registrada"
                description={
                  stats?.dificultades.ultimaAlta
                    ? `Grado actual: ${stats.dificultades.ultimaAlta.gradoActual}`
                    : "No tienes registros en grado Alto"
                }
                value={stats?.dificultades.ultimaAlta?.nombre || "Ninguno"}
                icon={<Warning />}
                color={
                  stats?.dificultades.ultimaAlta?.gradoActual === "Alto"
                    ? "error"
                    : stats?.dificultades.ultimaAlta?.gradoActual === "Medio"
                      ? "warning"
                      : stats?.dificultades.ultimaAlta?.gradoActual === "Bajo"
                        ? "success"
                        : stats?.dificultades.ultimaAlta?.gradoActual ===
                            "Ninguno"
                          ? "info"
                          : "error"
                }
              />
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ROW 3: CONSULTAS Y SESIONES */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "info.main",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <MarkUnreadChatAlt color="info" sx={{ mr: 1 }} />
              <Typography variant="h6" color="info.main" fontWeight="bold">
                Mis Consultas
              </Typography>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Estado General ({stats?.consultas.total} totales)
            </Typography>
            <DistributionBar
              items={
                stats?.consultas.distribucion?.map((c) => ({
                  label:
                    EstadoConsultaLabels[c.label as estado_consulta] || c.label,
                  value: c.value,
                  color: getEstadoConsultaColor(c.label),
                })) ?? []
              }
            />
            <Divider sx={{ my: 2 }} />
            <Grid size={{ xs: 12 }}>
              <ReportTextualCard
                title={ultimaConsultaTitle}
                description={ultimaConsultaDescription}
                value={ultimaConsultaValue}
                icon={<MarkUnreadChatAlt />}
                color={ultimaConsultaColor}
              />
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "#9c27b0",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <SwitchAccessShortcutAdd sx={{ mr: 1, color: "#9c27b0" }} />
              <Typography variant="h6" color="#9c27b0" fontWeight="bold">
                Mis Sesiones
              </Typography>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Estado General ({stats?.sesiones.total ?? 0} totales)
            </Typography>
            <DistributionBar
              items={
                stats?.sesiones.distribucion?.map((s) => ({
                  label:
                    EstadoSesionLabels[s.label as estado_sesion] || s.label,
                  value: s.value,
                  color: getEstadoSesionColor(s.label),
                })) ?? []
              }
            />
            <Divider sx={{ my: 2 }} />
            <Grid size={{ xs: 12 }}>
              <ReportTextualCard
                title={sesionTitle}
                description={sesionDescription}
                value={sesionValue}
                icon={<SwitchAccessShortcutAdd />}
                color={sesionColor}
              />
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
