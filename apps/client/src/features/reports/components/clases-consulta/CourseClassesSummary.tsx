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
import AssessmentIcon from "@mui/icons-material/Assessment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FunctionsIcon from "@mui/icons-material/Functions";
import CategoryIcon from "@mui/icons-material/Category";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  getCourseClassesSummary,
  type CourseClassesSummaryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportTextualCard from "../common/ReportTextualCard";
import ReportStatCard from "../common/ReportStatCard";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";

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
  const [chartGrouping, setChartGrouping] = useState<
    "ESTADO" | "ORIGEN" | "AMBOS"
  >("ESTADO");

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
          title="Resumen de Clases de Consulta"
          description="Analiza la efectividad y distribución de las clases de consulta realizadas en el curso."
          icon={<AssessmentIcon />}
          filters={{ ...filters, courseId, agruparPor: chartGrouping }}
          endpointPathPdf={`/reportes/cursos/${courseId}/clases-consulta/resumen/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/clases-consulta/resumen/excel`}
          filenameExcel="resumen_clases.xlsx"
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
            {/* KPIs Generales */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <ReportTotalCard
                  resourceName="Clases"
                  total={data.kpis.totalClases}
                  active={data.kpis.activas}
                  inactive={data.kpis.inactivas}
                  icon={<FunctionsIcon fontSize="small" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <ReportStatCard
                  icon={<FunctionsIcon />}
                  title="Promedio Consultas por Clase"
                  subtitle="Consultas agendadas por clase activa."
                  count={data.kpis.promConsultasPorClase.toFixed(1)}
                  color="primary"
                />
              </Grid>

              {/* Efectividad de Revisión */}
              <Grid size={{ xs: 12, md: 3.5 }}>
                <ReportTextualCard
                  icon={<CategoryIcon />}
                  title="Tema de consulta más frecuente en clases"
                  value={data.topTopic.name}
                  description={
                    <>
                      Presente en <b>{data.topTopic.count}</b> consultas
                      tratadas en clases (
                      <b>{data.topTopic.percentage.toFixed(1)}%</b> del total).
                    </>
                  }
                  color="info"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3.5 }}>
                {/* Top Docente */}
                <ReportTextualCard
                  icon={<SchoolIcon />}
                  title="Docente con más clases realizadas"
                  value={data.topTeacher.name}
                  description={
                    <>
                      Ha llevado a cabo un total de{" "}
                      <b>{data.topTeacher.count}</b> clases de consulta
                      realizadas.
                    </>
                  }
                  color="primary"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {/* Gráfico Agrupado */}
              <Grid size={{ xs: 12, md: 6 }}>
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                    mb={2}
                  >
                    <Typography variant="h6">Distribución de Clases</Typography>
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
                        <MenuItem value="ORIGEN">Por Origen</MenuItem>
                        <MenuItem value="AMBOS">Estado y Origen</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  {chartGrouping === "AMBOS" ? (
                    <BarChart
                      dataset={data.graficoEstadosOrigen}
                      xAxis={[{ scaleType: "band", dataKey: "estado" }]}
                      series={[
                        {
                          dataKey: "Sistema",
                          label: "Sistema",
                          color: "#9c27b0",
                          stack: "A",
                        },
                        {
                          dataKey: "Docente",
                          label: "Docente",
                          color: "#ff9800",
                          stack: "A",
                        },
                      ]}
                      height={280}
                      width={500}
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
                              : data.graficoOrigen,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          highlightScope: { fade: "global", highlight: "item" },
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

              {/* Stats Detalladas */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2} sx={{ height: "100%" }}>
                  {/* Top Topic */}
                  <ReportTextualCard
                    icon={<FactCheckIcon />}
                    title="Efectividad de Revisión en Vivo"
                    value={`${data.efectividad.promedioRevisadasPct.toFixed(1)}%`}
                    description={
                      <>
                        En promedio, el{" "}
                        <b>
                          {data.efectividad.promedioRevisadasPct.toFixed(1)}%
                        </b>{" "}
                        de las consultas agendadas son revisadas en clase.
                      </>
                    }
                    color="info"
                  />

                  {/* Impacto en Resolución */}
                  <ReportTextualCard
                    icon={<CheckCircleIcon />}
                    title="Impacto en Resolución"
                    value={`${data.impacto.porcentaje.toFixed(1)}%`}
                    description={
                      <>
                        El <b>{data.impacto.porcentaje.toFixed(1)}%</b> de las
                        consultas resueltas del curso fueron tratadas en una
                        clase de consulta.
                      </>
                    }
                    color="success"
                  />

                  {/* Efectividad Sistema */}
                  <ReportTextualCard
                    icon={<AutoAwesomeIcon />}
                    title="Efectividad de Clases de Consulta Automáticas"
                    value={`${data.kpis.origen.pctSistemaRealizadas.toFixed(1)}%`}
                    description={
                      <>
                        De las clases generadas por el sistema, el{" "}
                        <b>
                          {data.kpis.origen.pctSistemaRealizadas.toFixed(1)}%
                        </b>{" "}
                        fueron efectivamente realizadas por un docente.
                      </>
                    }
                    color="secondary"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
