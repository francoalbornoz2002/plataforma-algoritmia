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
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { PieChart } from "@mui/x-charts/PieChart";

import {
  getCourseClassesSummary,
  type CourseClassesSummaryFilters,
} from "../../service/reports.service";

interface Props {
  courseId: string;
}

export default function CourseClassesSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseClassesSummaryFilters>({
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseClassesSummary(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de clases de consulta.");
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
        Resumen de Clases de Consulta
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
          {/* KPIs Generales */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Clases
                  </Typography>
                  <Typography
                    variant="h4"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    {data.kpis.totalClases}
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
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Promedio Consultas/Clase
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {data.kpis.promConsultasPorClase.toFixed(1)}
                  </Typography>
                  <Typography variant="caption">
                    Consultas agendadas por clase activa
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* Efectividad de Revisión */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={3}
                sx={{ p: 2, height: "100%", bgcolor: "info.50" }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FactCheckIcon color="info" fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Efectividad de Revisión en Vivo
                    </Typography>
                  </Stack>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    {data.efectividad.promedioRevisadasPct.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    En promedio, el{" "}
                    <b>{data.efectividad.promedioRevisadasPct.toFixed(1)}%</b>{" "}
                    de las consultas agendadas son revisadas y tratadas durante
                    la clase.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={3}>
            {/* Gráfico de Estados */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom align="center">
                  Estado de Clases
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficoEstados,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                  ]}
                  height={250}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Stats Detalladas */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                {/* Impacto en Resolución */}
                <Paper
                  elevation={3}
                  sx={{ p: 3, flex: 1, bgcolor: "success.50" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <CheckCircleIcon color="success" fontSize="large" />
                    <Typography variant="h6">Impacto en Resolución</Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="success.main"
                    gutterBottom
                  >
                    {data.impacto.porcentaje.toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">
                    El <b>{data.impacto.porcentaje.toFixed(1)}%</b> de las
                    consultas resueltas del curso fueron tratadas en una clase
                    de consulta.
                  </Typography>
                </Paper>

                {/* Top Docente */}
                <Paper elevation={3} sx={{ p: 3, flex: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <SchoolIcon color="primary" fontSize="large" />
                    <Typography variant="h6">
                      Docente con más clases de consulta realizadas
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {data.topTeacher.name}
                  </Typography>
                  <Typography variant="body2">
                    Ha llevado a cabo un total de <b>{data.topTeacher.count}</b>{" "}
                    clases de consulta realizadas.
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
