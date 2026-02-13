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
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import FunctionsIcon from "@mui/icons-material/Functions";
import TopicIcon from "@mui/icons-material/Topic";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  getCourseDifficultiesReport,
  type CourseDifficultiesReportFilters,
} from "../../service/reports.service";
import { useOptionalCourseContext } from "../../../../context/CourseContext";
import ReportTextualCard from "../common/ReportTextualCard";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";
import { temas } from "../../../../types";
import { TemasLabels } from "../../../../types/traducciones";
import { datePickerConfig } from "../../../../config/theme.config";

interface Props {
  courseId: string;
}

export default function CourseDifficultiesSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseDifficultiesReportFilters>({
    fechaCorte: "",
  });
  const courseContext = useOptionalCourseContext();

  const courseCreatedAt =
    courseContext?.selectedCourse?.id === courseId
      ? courseContext?.selectedCourse?.createdAt
      : undefined;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseDifficultiesReport(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el reporte de dificultades.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  const handleClearFilter = () => {
    setFilters({ ...filters, fechaCorte: "" });
  };

  // Preparar datos para el gráfico de barras apiladas
  const barChartData =
    data?.distribucionGrados?.map((item: any) => ({
      nombre: item.nombre,
      ninguno: item.grados.Ninguno || 0,
      bajo: item.grados.Bajo,
      medio: item.grados.Medio,
      alto: item.grados.Alto,
    })) || [];

  // Paleta de 15 colores bien diferenciados para las dificultades
  const DISTINCT_COLORS = [
    "#d32f2f", // Rojo
    "#1976d2", // Azul
    "#388e3c", // Verde
    "#f57c00", // Naranja
    "#7b1fa2", // Púrpura
    "#0097a7", // Cian
    "#c2185b", // Rosa fuerte
    "#5d4037", // Marrón
    "#afb42b", // Lima oscuro
    "#0288d1", // Azul claro
    "#689f38", // Verde claro
    "#e64a19", // Naranja oscuro
    "#512da8", // Violeta oscuro
    "#455a64", // Gris azulado
    "#fbc02d", // Amarillo oscuro
  ];

  // Generar colores únicos para el gráfico de torta de dificultades
  const difficultiesPieData =
    data?.graficos?.porDificultad?.map((item: any, index: number) => ({
      ...item,
      color: DISTINCT_COLORS[index % DISTINCT_COLORS.length],
    })) || [];

  // Calcular el máximo valor para el eje X para que las barras sean proporcionales al total de alumnos
  const maxBarValue = barChartData.reduce(
    (acc: number, item: any) =>
      Math.max(acc, item.ninguno + item.bajo + item.medio + item.alto),
    0,
  );
  const xMax =
    data?.kpis?.totalAlumnos > 0
      ? Math.max(data.kpis.totalAlumnos, maxBarValue)
      : undefined;

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
          Resumen de Dificultades del Curso
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/dificultades/resumen/pdf`}
            disabled={!data}
          />
          <ExcelExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/dificultades/resumen/excel`}
            disabled={!data}
            filename="resumen_dificultades.xlsx"
          />
        </Box>
      </Stack>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <DatePicker
            label="Fecha de Corte (Histórico)"
            value={
              filters.fechaCorte
                ? new Date(filters.fechaCorte + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaCorte: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            {...datePickerConfig}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    width: 250,
                  },
                },
                sx: { width: 250 },
              },
            }}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
          />
          {filters.fechaCorte && (
            <Button variant="text" size="small" onClick={handleClearFilter}>
              Ver Actual
            </Button>
          )}
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
            <Grid size={{ xs: 12, md: 1.9 }}>
              <ReportTextualCard
                icon={<FunctionsIcon />}
                title="Prom. Dificultades"
                value={data.kpis.promDificultades.toFixed(1)}
                description={`Por alumno. Total alumnos: ${data.kpis.totalAlumnos}`}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3.1 }}>
              <ReportTextualCard
                icon={<TopicIcon />}
                title="Tema Más Frecuente"
                value={TemasLabels[data.kpis.temaFrecuente.nombre as temas]}
                description={
                  <>
                    El <b>{data.kpis.temaFrecuente.pctAlumnos.toFixed(1)}%</b>{" "}
                    de alumnos poseen dificultades de este tema.
                  </>
                }
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <ReportTextualCard
                icon={<WarningIcon />}
                title="Dificultad Más Frecuente"
                value={data.kpis.dificultadFrecuente.nombre}
                description={
                  <>
                    El{" "}
                    <b>
                      {data.kpis.dificultadFrecuente.pctAlumnos.toFixed(1)}%
                    </b>{" "}
                    de alumnos del curso poseen esta dificultad.
                  </>
                }
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <ReportTextualCard
                icon={<TrendingUpIcon />}
                title="Dificultades en Grado Alto"
                value={`${data.kpis.gradoAlto.pctAlumnos.toFixed(1)}%`}
                description={
                  <>
                    Más frecuente: <b>{data.kpis.gradoAlto.modaNombre}</b>
                  </>
                }
                color="error"
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Gráficos de Distribución */}
          <Grid container spacing={3}>
            {/* Izquierda: Por Dificultad (Más grande) */}
            <Grid size={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Typography variant="h6" align="center" gutterBottom>
                  Cantidad de alumnos afectados de cada Dificultad
                </Typography>
                <PieChart
                  series={[
                    {
                      data: difficultiesPieData,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={400}
                  sx={{ width: "100%" }}
                  slotProps={{
                    legend: {
                      direction: "vertical",
                      position: { vertical: "middle", horizontal: "end" },
                      sx: { ml: 10 },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Derecha: Stack de Tema y Grado */}
            <Grid size={6}>
              <Stack spacing={3}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h6" align="center" gutterBottom>
                    Cantidad de alumnos con dificultades activas por tema
                  </Typography>
                  <PieChart
                    series={[
                      {
                        data: data.graficos.porTema,
                        innerRadius: 30,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    height={180}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                    margin={{ bottom: 20 }}
                  />
                </Paper>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h6" align="center" gutterBottom>
                    Distribución de alumnos por Grado de Dificultad
                  </Typography>
                  <PieChart
                    series={[
                      {
                        data: data.graficos.porGrado,
                        innerRadius: 30,
                        paddingAngle: 1,
                        cornerRadius: 4,
                      },
                    ]}
                    height={180}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                  />
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          {/* Gráfico Detallado (Barras Apiladas) */}
          <Paper elevation={3} sx={{ p: 2, width: "100%" }}>
            <Typography variant="h6">
              Detalle de Alumnos afectados por Dificultad
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Cantidad de alumnos que presentan cada dificultad, desglosado por
              grado.
            </Typography>
            {barChartData.length > 0 ? (
              <BarChart
                dataset={barChartData}
                layout="horizontal"
                yAxis={[
                  {
                    scaleType: "band",
                    categoryGapRatio: 0.9,
                    dataKey: "nombre",
                    label: "Dificultad",
                    width: 280,
                    tickLabelStyle: {
                      fontSize: 10,
                    },
                  },
                ]}
                xAxis={[
                  {
                    label: "Cantidad de alumnos",
                    dataKey: "total",
                    tickMinStep: 1,
                    max: xMax,
                    valueFormatter: (value: number | null) =>
                      value !== null ? value.toString() : "",
                  },
                ]}
                series={[
                  {
                    dataKey: "ninguno",
                    label: "Ninguno (Superada)",
                    stack: "total",
                    color: "#9e9e9e",
                  },
                  {
                    dataKey: "bajo",
                    label: "Bajo",
                    stack: "total",
                    color: "#4caf50",
                  },
                  {
                    dataKey: "medio",
                    label: "Medio",
                    stack: "total",
                    color: "#ff9800",
                  },
                  {
                    dataKey: "alto",
                    label: "Alto",
                    stack: "total",
                    color: "#f44336",
                  },
                ]}
                height={500}
                sx={{ width: "100%" }}
              />
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No hay datos suficientes para mostrar el gráfico.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}
    </Paper>
  );
}
