import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import FunctionsIcon from "@mui/icons-material/Functions";
import TopicIcon from "@mui/icons-material/Topic";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import {
  getCourseDifficultiesReport,
  type CourseDifficultiesReportFilters,
} from "../../service/reports.service";
import ReportTextualCard from "../common/ReportTextualCard";
import { temas } from "../../../../types";
import { TemasLabels } from "../../../../types/traducciones";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import ReportTotalCard from "../common/ReportTotalCard";

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

  // Mapear los nombres de los temas a sus etiquetas amigables
  const temasPieData =
    data?.graficos?.porTema?.map((item: any) => ({
      ...item,
      label: TemasLabels[item.label as temas] || item.label,
    })) || [];

  // Calcular el máximo valor para el eje X para que las barras sean proporcionales al total de alumnos
  const maxBarValue = barChartData.reduce(
    (acc: number, item: any) =>
      Math.max(acc, item.ninguno + item.bajo + item.medio + item.alto),
    0,
  );

  const totalDifficulties = difficultiesPieData.reduce(
    (acc: number, curr: any) => acc + curr.value,
    0,
  );
  const totalTemas = temasPieData.reduce(
    (acc: number, curr: any) => acc + curr.value,
    0,
  );
  const totalGrados =
    data?.graficos?.porGrado?.reduce(
      (acc: number, curr: any) => acc + curr.value,
      0,
    ) || 0;

  const xMax =
    data?.kpis?.totalAlumnos > 0
      ? Math.max(data.kpis.totalAlumnos, maxBarValue)
      : undefined;

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
          title="Resumen de Dificultades"
          description="Consulta el estado actual de las dificultades detectadas en el curso."
          icon={<WarningIcon />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/dificultades/resumen/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/dificultades/resumen/excel`}
          filenameExcel="resumen_dificultades.xlsx"
          disabled={!data}
        />

        {/* Filtros */}
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
          />
          <Tooltip title="Limpiar filtro (Ver Actual)">
            <IconButton
              onClick={handleClearFilter}
              size="small"
              color="primary"
            >
              <FilterAltOffIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {showLoading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {data && !showLoading && (
          <Stack spacing={3}>
            {/* KPIs */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2.7 }}>
                <ReportTotalCard
                  icon={<FunctionsIcon fontSize="small" />}
                  resourceName="Prom. Dificultades por Alumno"
                  total={data.kpis.promDificultades.toFixed(1)}
                  active={data.kpis.totalAlumnos}
                  inactive={data.kpis.totalAlumnosInactivos}
                  activeLabelPrefix="Alumnos"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.6 }}>
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
              <Grid size={{ xs: 12, md: 4.2 }}>
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
                  value={`${data.kpis.gradoAlto.porcentaje.toFixed(1)}%`}
                  description={
                    <>
                      Del total de registradas. Moda:{" "}
                      <b>{data.kpis.gradoAlto.modaNombre}</b>
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
              <Grid size={7}>
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
                        highlightScope: { fade: "global", highlight: "item" },
                        valueFormatter: (v: any) => {
                          const val = typeof v === "number" ? v : v?.value;
                          const pct =
                            totalDifficulties > 0
                              ? ((val / totalDifficulties) * 100).toFixed(1)
                              : "0.0";
                          return `${val} (${pct}%)`;
                        },
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
              <Grid size={5}>
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
                      Cantidad de alumnos con dificultades activas por Tema
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: temasPieData,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          highlightScope: { fade: "global", highlight: "item" },
                          valueFormatter: (v: any) => {
                            const val = typeof v === "number" ? v : v?.value;
                            const pct =
                              totalTemas > 0
                                ? ((val / totalTemas) * 100).toFixed(1)
                                : "0.0";
                            return `${val} (${pct}%)`;
                          },
                        },
                      ]}
                      height={180}
                      slotProps={{
                        legend: {
                          direction: "vertical",
                          position: {
                            vertical: "middle",
                            horizontal: "center",
                          },
                          sx: { ml: -5 },
                        },
                      }}
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
                      Cantidad de alumnos afectados por Grado de Dificultad
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: data.graficos.porGrado,
                          innerRadius: 30,
                          paddingAngle: 1,
                          cornerRadius: 4,
                          highlightScope: { fade: "global", highlight: "item" },
                          valueFormatter: (v: any) => {
                            const val = typeof v === "number" ? v : v?.value;
                            const pct =
                              totalGrados > 0
                                ? ((val / totalGrados) * 100).toFixed(1)
                                : "0.0";
                            return `${val} (${pct}%)`;
                          },
                        },
                      ]}
                      height={180}
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
                Cantidad de alumnos que presentan cada dificultad, desglosado
                por grado.
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
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  No hay datos suficientes para mostrar el gráfico.
                </Typography>
              )}
            </Paper>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
