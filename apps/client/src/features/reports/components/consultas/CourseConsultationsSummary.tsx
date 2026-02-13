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
import ReportTotalCard from "../common/ReportTotalCard";
import ReportStatCard from "../common/ReportStatCard";
import ReportTextualCard from "../common/ReportTextualCard";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";

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
    <Box
      component="section"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <HeaderReportPage
          title="Resumen de Consultas"
          description="Consulta el estado y distribución de las dudas planteadas por los alumnos."
          icon={<CategoryIcon />}
          filters={{ ...filters, courseId, agruparPor: chartGrouping }}
          endpointPathPdf={`/reportes/cursos/${courseId}/consultas/resumen/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/consultas/resumen/excel`}
          filenameExcel="resumen_consultas.xlsx"
          disabled={!data}
        />

        {/* Filtros */}
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />
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
              {...datePickerConfig}
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      width: 200,
                    },
                  },
                  sx: { width: 200 },
                },
              }}
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
              {...datePickerConfig}
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      width: 200,
                    },
                  },
                  sx: { width: 200 },
                },
              }}
            />
            <Button variant="text" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>
        </Stack>

        {showLoading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {data && !showLoading && (
          <Stack spacing={2}>
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
                        onChange={(e) =>
                          setChartGrouping(e.target.value as any)
                        }
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
                        {
                          dataKey: "No_resuelta",
                          label: "No Resuelta",
                          color: "#9e9e9e",
                          stack: "A",
                        },
                      ]}
                      height={280}
                      width={600}
                      slotProps={{
                        legend: {
                          direction: "horizontal",
                          position: {
                            vertical: "bottom",
                            horizontal: "center",
                          },
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
                          position: {
                            vertical: "bottom",
                            horizontal: "center",
                          },
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
                        <b>{data.topTeacher.percentage.toFixed(1)}%</b> del
                        total de consultas del curso.
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
                        percentage={
                          data.kpis.impactoClases.revisadas.percentage
                        }
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
                        percentage={
                          data.kpis.impactoClases.resueltas.percentage
                        }
                        color="success"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
