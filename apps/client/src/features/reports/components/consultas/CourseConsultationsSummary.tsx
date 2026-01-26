import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ClassIcon from "@mui/icons-material/Class";
import { PieChart } from "@mui/x-charts/PieChart";

import {
  getCourseConsultationsSummary,
  type CourseConsultationsSummaryFilters,
} from "../../service/reports.service";

interface Props {
  courseId: string;
}

export default function CourseConsultationsSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseConsultationsSummaryFilters>({
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseConsultationsSummary(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de consultas.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  const handleClearFilters = () => {
    setFilters({ fechaDesde: "", fechaHasta: "" });
  };

  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        color="primary.main"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Resumen de Consultas del Curso
      </Typography>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <DatePicker
            label="Fecha Desde"
            value={
              filters.fechaDesde
                ? new Date(filters.fechaDesde + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
          />
          <DatePicker
            label="Fecha Hasta"
            value={
              filters.fechaHasta
                ? new Date(filters.fechaHasta + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
          />
          <Button variant="text" onClick={handleClearFilters}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      {/* Acciones */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!data}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={!data}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={3}>
          {/* KPIs */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Consultas
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {data.kpis.totalConsultas}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" color="success.main">
                    Activas: {data.kpis.activas}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Inactivas: {data.kpis.inactivas}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Consultas resueltas
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    color="success.main"
                    fontWeight="bold"
                  >
                    {data.kpis.resueltas.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    {data.kpis.resueltas.count} consultas resueltas
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PendingIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Consultas por atender
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    color="warning.main"
                    fontWeight="bold"
                  >
                    {data.kpis.pendientes.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    {data.kpis.pendientes.count} pendientes o a revisar
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* --- Impacto de Clases --- */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={3}
                sx={{ p: 2, height: "100%", bgcolor: "info.50" }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ClassIcon color="info" fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Atendidas en Clases de Consulta
                    </Typography>
                  </Stack>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {data.kpis.impactoClases.revisadas.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    {data.kpis.impactoClases.revisadas.count} consultas fueron
                    revisadas en vivo durante una clase.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={3}
                sx={{ p: 2, height: "100%", bgcolor: "success.50" }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Resueltas vía Clase
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    color="success.main"
                    fontWeight="bold"
                  >
                    {data.kpis.impactoClases.resueltas.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    {data.kpis.impactoClases.resueltas.count} consultas se
                    resolvieron tras ser revisadas en clase.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          {/* Gráfico y Estadísticas */}
          <Grid container spacing={3}>
            {/* Gráfico de Torta */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Estado de Consultas Activas
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficoEstados,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { fade: "global", highlight: "item" },
                      faded: {
                        innerRadius: 30,
                        additionalRadius: -30,
                        color: "gray",
                      },
                    },
                  ]}
                  height={300}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Top Stats */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                {/* Top Docente */}
                <Paper
                  elevation={3}
                  sx={{ p: 3, flex: 1, bgcolor: "primary.50" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <SchoolIcon color="primary" fontSize="large" />
                    <Typography variant="h6">
                      Docente más qué más consultas responde
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {data.topTeacher.name}
                  </Typography>
                  <Typography variant="body2">
                    Ha respondido o atendido <b>{data.topTeacher.count}</b>{" "}
                    consultas, lo que representa el{" "}
                    <b>{data.topTeacher.percentage.toFixed(1)}%</b> del total de
                    consultas del curso.
                  </Typography>
                </Paper>

                {/* Top Alumno */}
                <Paper
                  elevation={3}
                  sx={{ p: 3, flex: 1, bgcolor: "secondary.50" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <PersonIcon color="primary" fontSize="large" />
                    <Typography variant="h6">
                      Alumno con más consultas
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {data.topStudent.name}
                  </Typography>
                  <Typography variant="body2">
                    Realizó un total de <b>{data.topStudent.count}</b>{" "}
                    consultas, representando el{" "}
                    <b>{data.topStudent.percentage.toFixed(1)}%</b> de las
                    consultas realizadas en el curso.
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Paper>
  );
}
