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
  Person,
  School,
  Class,
  Event,
  Add,
  Assessment,
  CheckCircle,
  Cancel,
  SupervisorAccount,
  LocationCity,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { getAdminDashboardStats } from "../users/services/user.service";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar estadísticas del sistema.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  return (
    <Stack spacing={3} sx={{ height: "100%" }}>
      {/* HEADER */}
      <Box>
        <Typography variant="h4" gutterBottom>
          ¡Hola, {profile?.nombre}! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Panel de Administración General
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* --- COLUMNA IZQUIERDA (Estadísticas) --- */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={3}>
            {/* 1. USUARIOS */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Usuarios
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Total Usuarios"
                    value={stats?.users.total}
                    subtitle={`${stats?.users.active} Activos`}
                    icon={<Person />}
                    color="primary"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Docentes"
                    value={stats?.users.docentes}
                    subtitle="Registrados"
                    icon={<SupervisorAccount />}
                    color="info"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Alumnos"
                    value={stats?.users.alumnos}
                    subtitle="Registrados"
                    icon={<School />}
                    color="success"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 2. CURSOS */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Cursos
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Total Cursos"
                    value={stats?.courses.total}
                    subtitle={`${stats?.courses.active} Activos`}
                    icon={<Class />}
                    color="secondary"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Finalizados"
                    value={stats?.courses.finalized}
                    subtitle="Ciclo cerrado"
                    icon={<CheckCircle />}
                    color="warning" // Gris oscuro no hay en palette por defecto, warning es visible
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DashboardStatCard
                    title="Inactivos"
                    value={stats?.courses.inactive}
                    subtitle="Dados de baja"
                    icon={<Cancel />}
                    color="error"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 3. ACTIVIDAD RECIENTE (Semana) */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Actividad de la Semana
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DashboardTextCard
                    title="Clases de Consulta"
                    value={`${stats?.classes.week.total} Generadas`}
                    description={`${stats?.classes.week.pctRealizadas.toFixed(0)}% Realizadas | ${stats?.classes.week.pctCanceladas.toFixed(0)}% Canceladas`}
                    icon={<Event />}
                    color="info"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DashboardTextCard
                    title="Sesiones de Refuerzo"
                    value={`${stats?.sessions.week.total} Generadas`}
                    description={`${stats?.sessions.week.pctCompletadas.toFixed(0)}% Completadas | ${stats?.sessions.week.pctPendientes.toFixed(0)}% Pendientes`}
                    icon={<Assessment />}
                    color="success"
                  />
                </Grid>
              </Grid>
            </Paper>
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
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/users")}
              >
                Gestionar Usuarios
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={() => navigate("/courses")}
              >
                Gestionar Cursos
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate("/auditoria")}
              >
                Ver Auditoría
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LocationCity />}
                onClick={() => navigate("/dashboard/settings")}
              >
                Registrar Institución
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate("/dashboard/reports")}
              >
                Generar Reportes
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
