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
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import TableOnIcon from "@mui/icons-material/TableChart";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ClassIcon from "@mui/icons-material/Class";
import CategoryIcon from "@mui/icons-material/Category";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  getCourseConsultationsSummary,
  getCourseConsultationsSummaryPdf,
  type CourseConsultationsSummaryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";

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
  const [chartGrouping, setChartGrouping] = useState<
    "ESTADO" | "TEMA" | "AMBOS"
  >("ESTADO");

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

  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          color="primary.main"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          Resumen de Consultas del Curso
        </Typography>
        {/* Acciones */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={{ ...filters, courseId, agruparPor: chartGrouping }}
            exportFunction={getCourseConsultationsSummaryPdf}
            fileName="resumen-consultas.pdf"
            disabled={!data}
            onError={setError}
          />
          <Button
            variant="outlined"
            startIcon={<TableOnIcon />}
            disabled={!data}
            color="success"
          >
            Exportar Excel
          </Button>
        </Box>
      </Stack>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <QuickDateFilter onApply={handleQuickFilter} />
        <Box sx={{ mt: 2 }} />
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

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={3}>
          {/* KPIs */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: "100%",
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                }}
              >
                <Stack spacing={0.5} justifyContent="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Consultas
                  </Typography>
                  <Typography
                    variant="h4"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    {data.kpis.totalConsultas}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Typography
                      variant="caption"
                      display="block"
                      color="success.main"
                      fontWeight="bold"
                    >
                      Activas: {data.kpis.activas}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.disabled"
                    >
                      Inactivas: {data.kpis.inactivas}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* --- Consultas resueltas --- */}
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: "100%",
                  borderLeft: "4px solid",
                  borderColor: "success.main",
                }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Consultas resueltas
                    </Typography>
                  </Stack>
                  <Typography variant="caption">
                    Que poseen respuesta y valoración
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    <Typography
                      variant="h4"
                      color="success.main"
                      fontWeight="bold"
                    >
                      {data.kpis.resueltas.count}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      ({data.kpis.resueltas.percentage.toFixed(1)}%)
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {/* --- Consultas por atender --- */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: "100%",
                  borderLeft: "4px solid",
                  borderColor: "warning.main",
                }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PendingIcon color="warning" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Consultas por atender
                    </Typography>
                  </Stack>
                  <Typography variant="caption">
                    Pendientes o a revisar
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    <Typography
                      variant="h4"
                      color="warning.main"
                      fontWeight="bold"
                    >
                      {data.kpis.pendientes.count}
                    </Typography>
                    <Typography variant="caption" color="warning.main">
                      ({data.kpis.pendientes.percentage.toFixed(1)}%)
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* Top Tema */}
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: "100%",
                  bgcolor: "warning.50",
                  borderLeft: "4px solid",
                  borderColor: "info.main",
                }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <CategoryIcon color="info" />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Tema más consultado
                    </Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight="bold">
                    {data.topTopic.name}
                  </Typography>
                  <Typography variant="caption">
                    Concentra <b>{data.topTopic.count}</b> consultas (
                    <b>{data.topTopic.percentage.toFixed(1)}%</b> del total).
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {/* Gráfico de Torta */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  mb={2}
                >
                  <Typography variant="h6">
                    Distribución de Consultas
                  </Typography>
                  <FormControl size="small" variant="standard">
                    <Select
                      value={chartGrouping}
                      onChange={(e) => setChartGrouping(e.target.value as any)}
                      disableUnderline
                      sx={{ fontSize: "0.875rem", fontWeight: "bold" }}
                    >
                      <MenuItem value="ESTADO">Por Estado</MenuItem>
                      <MenuItem value="TEMA">Por Tema</MenuItem>
                      <MenuItem value="AMBOS">Tema y Estado</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                {chartGrouping === "AMBOS" ? (
                  <BarChart
                    dataset={data.graficoTemasEstados}
                    xAxis={[{ scaleType: "band", dataKey: "tema" }]}
                    series={[
                      {
                        dataKey: "Pendiente",
                        label: "Pendiente",
                        color: "#ff9800",
                        stack: "A",
                      },
                      {
                        dataKey: "A_revisar",
                        label: "A revisar",
                        color: "#2196f3",
                        stack: "A",
                      },
                      {
                        dataKey: "Revisada",
                        label: "Revisada",
                        color: "#9c27b0",
                        stack: "A",
                      },
                      {
                        dataKey: "Resuelta",
                        label: "Resuelta",
                        color: "#4caf50",
                        stack: "A",
                      },
                    ]}
                    height={280}
                    width={600}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                  />
                ) : (
                  <PieChart
                    series={[
                      {
                        data:
                          chartGrouping === "ESTADO"
                            ? data.graficoEstados
                            : data.graficoTemas,
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
                    height={280}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                  />
                )}
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                {/* Top Docente */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Stack direction="column" spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <SchoolIcon color="primary" />
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        fontWeight="bold"
                      >
                        Docente más qué más consultas responde
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {data.topTeacher.name}
                    </Typography>
                    <Typography variant="caption">
                      Ha respondido o atendido <b>{data.topTeacher.count}</b>{" "}
                      consultas, lo que representa el{" "}
                      <b>{data.topTeacher.percentage.toFixed(1)}%</b> del total
                      de consultas del curso.
                    </Typography>
                  </Stack>
                </Paper>
                {/* Top Alumno */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Stack direction="column" spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <PersonIcon color="primary" />
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        fontWeight="bold"
                      >
                        Alumno con más consultas realizadas
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {data.topStudent.name}
                    </Typography>
                    <Typography variant="caption">
                      Realizó un total de <b>{data.topStudent.count}</b>{" "}
                      consultas, representando el{" "}
                      <b>{data.topStudent.percentage.toFixed(1)}%</b> de las
                      consultas realizadas en el curso.
                    </Typography>
                  </Stack>
                </Paper>
                {/* KPIs De consultas */}
                <Grid container spacing={2}>
                  {/* --- Atendidas en clases de consulta --- */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        height: "100%",
                        borderLeft: "4px solid",
                        borderColor: "info.main",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ClassIcon color="info" fontSize="small" />
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            fontWeight="bold"
                          >
                            Atendidas en Clases de Consulta
                          </Typography>
                        </Stack>
                        <Typography variant="caption">
                          Consultas revisadas en vivo durante una clase
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                        >
                          <Typography
                            variant="h4"
                            color="info.main"
                            fontWeight="bold"
                          >
                            {data.kpis.impactoClases.revisadas.count}
                          </Typography>
                          <Typography variant="caption" color="info.main">
                            (
                            {data.kpis.impactoClases.revisadas.percentage.toFixed(
                              1,
                            )}
                            %)
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* --- Resueltas via clase --- */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        height: "100%",
                        borderLeft: "4px solid",
                        borderColor: "success.main",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            fontWeight="bold"
                          >
                            Resueltas vía Clase
                          </Typography>
                        </Stack>
                        <Typography variant="caption">
                          Consultas resueltas tras ser revisadas en clase
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                        >
                          <Typography
                            variant="h4"
                            color="success.main"
                            fontWeight="bold"
                          >
                            {data.kpis.impactoClases.resueltas.count}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            (
                            {data.kpis.impactoClases.resueltas.percentage.toFixed(
                              1,
                            )}
                            %)
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Paper>
  );
}
