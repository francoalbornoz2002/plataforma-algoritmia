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
  Assessment,
  CheckCircle,
  Cancel,
  SupervisorAccount,
  People,
  TrendingUp,
  Edit, // Para el botón de editar
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { getAdminDashboardStats } from "../users/services/user.service";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";
import type { AdminDashboardStats, Institucion } from "../../types"; // Importamos el tipo AdminDashboardStats y Institucion
import InstitutionInfo from "../institution/components/InstitutionInfo"; // Importamos el componente de información
import InstitutionForm from "../institution/components/InstitutionForm"; // Importamos el componente de formulario
import { Dialog } from "@mui/material"; // Para el modal

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstitutionFormModalOpen, setIsInstitutionFormModalOpen] =
    useState(false); // Estado para controlar el modal del formulario

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

  const handleInstitutionFormSave = (newData: Institucion) => {
    // Actualiza los datos de la institución en el estado del dashboard
    setStats((prevStats) => ({
      ...prevStats!,
      institution: newData,
    }));
    setIsInstitutionFormModalOpen(false); // Cierra el modal
  };

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
    <Stack spacing={3}>
      {" "}
      {/* Eliminamos height: "100%" para evitar scroll innecesario */}
      {/* HEADER */}
      <Paper
        elevation={3}
        sx={{ p: 2, borderLeft: "5px solid", borderColor: "primary.main" }}
      >
        <Stack spacing={1}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            ¡Hola, {profile?.nombre}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bienvenido al panel de administración general del sistema. Estas son
            algunas acciones rápidas que puedes realizar:
          </Typography>
        </Stack>
      </Paper>
      {/* ACCIONES RÁPIDAS */}
      <Stack spacing={1} direction="row">
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<People />}
          onClick={() => navigate("/dashboard/users")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Gestionar Usuarios
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<School />}
          onClick={() => navigate("/dashboard/courses")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Gestionar Cursos
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="warning"
          startIcon={<Assessment />}
          onClick={() => navigate("/dashboard/reports")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver Reportes
        </Button>
      </Stack>
      <Grid container spacing={3}>
        {/* 1. SECCIÓN USUARIOS (Columna Izquierda Superior) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              fontWeight="bold"
            >
              Estado de Usuarios
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Total Usuarios"
                  value={stats?.users.total ?? 0}
                  subtitle={`${stats?.users.active} Activos | ${stats?.users.inactive} Inactivos`}
                  icon={<Person />}
                  color="primary"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Docentes"
                  value={stats?.users.docentes ?? 0}
                  subtitle="Personal académico"
                  icon={<SupervisorAccount />}
                  color="info"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Alumnos"
                  value={stats?.users.alumnos ?? 0}
                  subtitle="Estudiantes registrados"
                  icon={<School />}
                  color="success"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Administradores"
                  value={stats?.users.admins ?? 0}
                  subtitle="Gestión de plataforma"
                  icon={<SupervisorAccount />}
                  color="secondary"
                  small
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 2. SECCIÓN CURSOS (Columna Derecha Superior) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography
              variant="h6"
              gutterBottom
              color="secondary"
              fontWeight="bold"
            >
              Estado de Cursos
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Total Cursos"
                  value={stats?.courses.total ?? 0}
                  subtitle={`${stats?.courses.active} Activos`}
                  icon={<Class />}
                  color="secondary"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Finalizados"
                  value={stats?.courses.finalized ?? 0}
                  subtitle="Ciclos cerrados"
                  icon={<CheckCircle />}
                  color="warning"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Inactivos"
                  value={stats?.courses.inactive ?? 0}
                  subtitle="Bajas lógicas"
                  icon={<Cancel />}
                  color="error"
                  small
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 3. SECCIÓN INSTITUCIÓN (Columna Izquierda Inferior) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="info"
                fontWeight="bold"
              >
                Datos de la Institución
              </Typography>
              <Button
                startIcon={<Edit />}
                size="small"
                variant="outlined"
                onClick={() => setIsInstitutionFormModalOpen(true)}
              >
                Editar Info
              </Button>
            </Box>
            <InstitutionInfo
              institucion={stats?.institution ?? null}
              isLoading={loading}
            />
          </Paper>
        </Grid>

        {/* 4. ACTIVIDAD GLOBAL (Semana) (Columna Derecha Inferior) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography
              variant="h6"
              gutterBottom
              color="success.main"
              fontWeight="bold"
            >
              Rendimiento Semanal del Sistema
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Clases Generadas"
                  value={stats?.classes.week.total ?? 0}
                  subtitle="Esta semana"
                  icon={<Event />}
                  color="info"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardTextCard
                  title="Efectividad Clases"
                  value={`${stats?.classes.week.pctRealizadas?.toFixed(0) ?? 0}%`}
                  description="Tasa de realización"
                  icon={<CheckCircle />}
                  color="success"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardStatCard
                  title="Sesiones Generadas"
                  value={stats?.sessions.week.total ?? 0}
                  subtitle="Esta semana"
                  icon={<TrendingUp />}
                  color="secondary"
                  small
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DashboardTextCard
                  title="Efectividad Sesiones"
                  value={`${stats?.sessions.week.pctCompletadas?.toFixed(0) ?? 0}%`}
                  description="Tasa de completitud"
                  icon={<Assessment />}
                  color="success"
                  small
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      {/* Modal para el formulario de la institución */}
      <Dialog
        open={isInstitutionFormModalOpen}
        onClose={() => setIsInstitutionFormModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <InstitutionForm
          initialData={stats?.institution ?? null}
          onSave={handleInstitutionFormSave}
        />
      </Dialog>
    </Stack>
  );
}
