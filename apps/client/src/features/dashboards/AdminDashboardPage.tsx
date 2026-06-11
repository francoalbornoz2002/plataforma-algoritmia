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
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  Person,
  School,
  Class,
  Event,
  Assessment,
  SupervisorAccount,
  People,
  TrendingUp,
  Edit,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../authentication/context/AuthProvider";
import { getAdminDashboardStats } from "../users/services/user.service";
import type { AdminDashboardStats } from "../../types";
import StatCard from "../../components/StatCard";
import DashboardHeader from "./components/DashboardHeader";

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
    <Box sx={{ width: "100%", mb: 2 }}>
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
  <Box sx={{ mb: 2 }}>
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

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
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
    <Stack spacing={3}>
      {/* Eliminamos height: "100%" para evitar scroll innecesario */}
      {/* HEADER */}
      <DashboardHeader nombre={profile?.nombre} />
      {/* ALERTA: Institución no registrada */}
      {!stats?.institution && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{
            mt: 2,
            alignItems: "center",
          }}
          action={
            <Button
              color="inherit"
              size="medium"
              onClick={() => navigate("/settings")}
            >
              Registrar Ahora
            </Button>
          }
        >
          No se han registrado los datos de la institución. Por favor, complete
          la información.
        </Alert>
      )}

      {/* KPI ROW 1 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Usuarios"
            value={stats?.users.total ?? 0}
            description="Registrados en el sistema"
            icon={<Person />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Cursos Activos"
            value={stats?.courses.active ?? 0}
            description={`De ${stats?.courses.total ?? 0} totales`}
            icon={<Class />}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Clases del Mes"
            value={stats?.classes.month.total ?? 0}
            description="Programadas y realizadas"
            icon={<Event />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Sesiones del Mes"
            value={stats?.sessions.month.total ?? 0}
            description="Refuerzos generados"
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* DETALLES DE USUARIOS Y CURSOS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <People color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary" fontWeight="bold">
                Distribución de Usuarios
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Por Rol
            </Typography>
            <DistributionBar
              items={[
                {
                  label: "Alumnos",
                  value: stats?.users.alumnos ?? 0,
                  color: "#2e7d32",
                },
                {
                  label: "Docentes",
                  value: stats?.users.docentes ?? 0,
                  color: "#0288d1",
                },
                {
                  label: "Administradores",
                  value: stats?.users.admins ?? 0,
                  color: "#9c27b0",
                },
              ]}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Por Estado
            </Typography>
            <DistributionBar
              items={[
                {
                  label: "Activos",
                  value: stats?.users.active ?? 0,
                  color: "#4caf50",
                },
                {
                  label: "Inactivos",
                  value: stats?.users.inactive ?? 0,
                  color: "#ef5350",
                },
              ]}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <School color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="secondary" fontWeight="bold">
                Estado de los Cursos
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Distribución General
            </Typography>
            <DistributionBar
              items={[
                {
                  label: "Activos",
                  value: stats?.courses.active ?? 0,
                  color: "#9c27b0",
                },
                {
                  label: "Finalizados",
                  value: stats?.courses.finalized ?? 0,
                  color: "#ed6c02",
                },
                {
                  label: "Inactivos",
                  value: stats?.courses.inactive ?? 0,
                  color: "#d32f2f",
                },
              ]}
            />

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <StatCard
                  title="Promedio"
                  value={
                    stats?.courses.active
                      ? Math.round(
                          (stats?.users.alumnos ?? 0) / stats.courses.active,
                        )
                      : 0
                  }
                  description="Alumnos x Curso Activo"
                  icon={<Person />}
                  color="info"
                  small
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <StatCard
                  title="Promedio"
                  value={
                    stats?.courses.active
                      ? Math.round(
                          (stats?.users.docentes ?? 0) / stats.courses.active,
                        )
                      : 0
                  }
                  description="Docentes x Curso Activo"
                  icon={<SupervisorAccount />}
                  color="secondary"
                  small
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* RENDIMIENTO DEL SISTEMA */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Event color="info" sx={{ mr: 1 }} />
              <Typography variant="h6" color="info.main" fontWeight="bold">
                Efectividad de Clases
              </Typography>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Semana Actual ({stats?.classes.week.total ?? 0} programadas)
            </Typography>
            <ProgressItem
              title="Realizadas"
              percent={stats?.classes.week.pctRealizadas ?? 0}
              color="success"
              valueText={`${(stats?.classes.week.pctRealizadas ?? 0).toFixed(1)}%`}
            />
            <ProgressItem
              title="Canceladas"
              percent={stats?.classes.week.pctCanceladas ?? 0}
              color="error"
              valueText={`${(stats?.classes.week.pctCanceladas ?? 0).toFixed(1)}%`}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Mes Actual ({stats?.classes.month.total ?? 0} programadas)
            </Typography>
            <ProgressItem
              title="Realizadas"
              percent={stats?.classes.month.pctRealizadas ?? 0}
              color="success"
              valueText={`${(stats?.classes.month.pctRealizadas ?? 0).toFixed(1)}%`}
            />
            <ProgressItem
              title="Canceladas"
              percent={stats?.classes.month.pctCanceladas ?? 0}
              color="error"
              valueText={`${(stats?.classes.month.pctCanceladas ?? 0).toFixed(1)}%`}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold">
                Efectividad de Sesiones de Refuerzo
              </Typography>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Semana Actual ({stats?.sessions.week.total ?? 0} generadas)
            </Typography>
            <ProgressItem
              title="Completadas"
              percent={stats?.sessions.week.pctCompletadas ?? 0}
              color="success"
              valueText={`${(stats?.sessions.week.pctCompletadas ?? 0).toFixed(1)}%`}
            />
            <ProgressItem
              title="Pendientes"
              percent={stats?.sessions.week.pctPendientes ?? 0}
              color="warning"
              valueText={`${(stats?.sessions.week.pctPendientes ?? 0).toFixed(1)}%`}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Mes Actual ({stats?.sessions.month.total ?? 0} generadas)
            </Typography>
            <ProgressItem
              title="Completadas"
              percent={stats?.sessions.month.pctCompletadas ?? 0}
              color="success"
              valueText={`${(stats?.sessions.month.pctCompletadas ?? 0).toFixed(1)}%`}
            />
            <ProgressItem
              title="Pendientes"
              percent={stats?.sessions.month.pctPendientes ?? 0}
              color="warning"
              valueText={`${(stats?.sessions.month.pctPendientes ?? 0).toFixed(1)}%`}
            />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
