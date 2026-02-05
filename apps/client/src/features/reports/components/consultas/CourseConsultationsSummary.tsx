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
import FunctionsIcon from "@mui/icons-material/Functions";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  getCourseConsultationsSummary,
  type CourseConsultationsSummaryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportStatCard from "../common/ReportStatCard";
import ReportTextualCard from "../common/ReportTextualCard";

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
            endpointPath={`/reportes/cursos/${courseId}/consultas/resumen/pdf`}
            disabled={!data}
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
              <ReportTotalCard
                resourceName="Consultas"
                total={data.kpis.totalConsultas}
                active={data.kpis.activas}
                inactive={data.kpis.inactivas}
                icon={<FunctionsIcon fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* --- Consultas resueltas --- */}
              <ReportStatCard
                icon={<CheckCircleIcon fontSize="small" />}
                title="Consultas resueltas"
                subtitle="Que poseen respuesta y valoración"
                count={data.kpis.resueltas.count}
                percentage={data.kpis.resueltas.percentage}
                color="success"
              />
            </Grid>

            {/* --- Consultas por atender --- */}
            <Grid size={{ xs: 12, md: 3 }}>
              <ReportStatCard
                icon={<PendingIcon fontSize="small" />}
                title="Consultas por atender"
                subtitle="Pendientes o a revisar"
                count={data.kpis.pendientes.count}
                percentage={data.kpis.pendientes.percentage}
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* Top Tema */}
              <ReportTextualCard
                icon={<CategoryIcon />}
                title="Tema más consultado"
                value={data.topTopic.name}
                description={
                  <>
                    Concentra <b>{data.topTopic.count}</b> consultas (
                    <b>{data.topTopic.percentage.toFixed(1)}%</b> del total).
                  </>
                }
                color="info"
              />
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
                <ReportTextualCard
                  icon={<SchoolIcon />}
                  title="Docente más qué más consultas responde"
                  value={data.topTeacher.name}
                  description={
                    <>
                      Ha respondido o atendido <b>{data.topTeacher.count}</b>{" "}
                      consultas, lo que representa el{" "}
                      <b>{data.topTeacher.percentage.toFixed(1)}%</b> del total
                      de consultas del curso.
                    </>
                  }
                  color="primary"
                />
                {/* Top Alumno */}
                <ReportTextualCard
                  icon={<PersonIcon />}
                  title="Alumno con más consultas realizadas"
                  value={data.topStudent.name}
                  description={
                    <>
                      Realizó un total de <b>{data.topStudent.count}</b>{" "}
                      consultas, representando el{" "}
                      <b>{data.topStudent.percentage.toFixed(1)}%</b> de las
                      consultas realizadas en el curso.
                    </>
                  }
                  color="primary"
                />
                {/* KPIs De consultas */}
                <Grid container spacing={2}>
                  {/* --- Atendidas en clases de consulta --- */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ReportStatCard
                      icon={<ClassIcon fontSize="small" />}
                      title="Atendidas en Clases de Consulta"
                      subtitle="Consultas revisadas en vivo durante una clase"
                      count={data.kpis.impactoClases.revisadas.count}
                      percentage={data.kpis.impactoClases.revisadas.percentage}
                      color="info"
                    />
                  </Grid>

                  {/* --- Resueltas via clase --- */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ReportStatCard
                      icon={<CheckCircleIcon fontSize="small" />}
                      title="Resueltas vía Clase"
                      subtitle="Consultas resueltas tras ser revisadas en clase"
                      count={data.kpis.impactoClases.resueltas.count}
                      percentage={data.kpis.impactoClases.resueltas.percentage}
                      color="success"
                    />
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
