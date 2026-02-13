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
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import WarningIcon from "@mui/icons-material/Warning";
import TopicIcon from "@mui/icons-material/Topic";
import FunctionsIcon from "@mui/icons-material/Functions";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  getCourseSessionsSummary,
  type CourseSessionsSummaryFilters,
} from "../../service/reports.service";
import { temas } from "../../../../types";
import { TemasLabels } from "../../../../types/traducciones";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportTextualCard from "../common/ReportTextualCard";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";
import { datePickerConfig } from "../../../../config/theme.config";

interface Props {
  courseId: string;
}

export default function CourseSessionsSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseSessionsSummaryFilters>({
    fechaDesde: "",
    fechaHasta: "",
  });

  const [chartGrouping, setChartGrouping] = useState<
    "ESTADO" | "ORIGEN" | "AMBOS"
  >("ESTADO");
  const [chartGrouping2, setChartGrouping2] = useState<
    "TEMA" | "DIFICULTAD" | "AMBOS"
  >("TEMA");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseSessionsSummary(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de sesiones de refuerzo.");
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

  // Helper para calcular porcentajes seguros
  const calcPct = (val: number, total: number) =>
    total > 0 ? (val / total) * 100 : 0;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          color="primary.main"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          Resumen de Sesiones de Refuerzo
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={{
              ...filters,
              courseId,
              agruparPor: chartGrouping,
              agruparPorContenido: chartGrouping2,
            }}
            endpointPath={`/reportes/cursos/${courseId}/sesiones-refuerzo/resumen/pdf`}
            disabled={!data}
          />
          <ExcelExportButton
            filters={{
              ...filters,
              agruparPor: chartGrouping,
              agruparPorContenido: chartGrouping2,
            }}
            endpointPath={`/reportes/cursos/${courseId}/sesiones-refuerzo/resumen/excel`}
            disabled={!data}
            filename="resumen_sesiones.xlsx"
          />
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
      </Paper>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={3}>
          {/* Fila 1: KPIs Generales */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <ReportTotalCard
                resourceName="Sesiones"
                total={data.kpis.total}
                active={data.kpis.activas}
                inactive={data.kpis.inactivas}
                icon={<FunctionsIcon fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ReportTextualCard
                icon={<TopicIcon />}
                title="Tema más frecuente"
                value={
                  TemasLabels[data.tops.tema.label as temas] ||
                  data.tops.tema.label
                }
                description={
                  <>
                    Abarca <b>{data.tops.tema.value}</b> sesiones.
                  </>
                }
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4.5 }}>
              <ReportTextualCard
                icon={<WarningIcon />}
                title="Dificultad más frecuente en sesiones"
                value={data.tops.dificultad.name}
                description={
                  <>
                    Presente en <b>{data.tops.dificultad.count}</b> sesiones.
                  </>
                }
                color="error"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <ReportTextualCard
                icon={<WarningIcon />}
                title="Grado Promedio por sesión"
                description="Dificultad promedio asignada"
                value={data.kpis.promedioGrado}
                color="warning"
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {/* Gráfico 1: Estado / Origen */}
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
                  <Typography variant="h6">Distribución de Sesiones</Typography>
                  <FormControl size="small" variant="standard">
                    <Select
                      value={chartGrouping}
                      onChange={(e) => setChartGrouping(e.target.value as any)}
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
                    dataset={data.graficos.estadosOrigen}
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
                            ? data.graficos.estados
                            : data.graficos.origen,
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
            {/* Gráfico 2: Tema / Dificultad */}
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
                  <Typography variant="h6">Contenido de Sesiones</Typography>
                  <FormControl size="small" variant="standard">
                    <Select
                      value={chartGrouping2}
                      onChange={(e) => setChartGrouping2(e.target.value as any)}
                      disableUnderline
                      sx={{ fontSize: "0.875rem", fontWeight: "bold" }}
                    >
                      <MenuItem value="TEMA">Por Tema</MenuItem>
                      <MenuItem value="DIFICULTAD">Por Dificultad</MenuItem>
                      <MenuItem value="AMBOS">Tema y Dificultad</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                {chartGrouping2 === "AMBOS" ? (
                  <BarChart
                    dataset={data.graficos.temasDificultades}
                    xAxis={[{ scaleType: "band", dataKey: "tema" }]}
                    series={data.graficos.allDifficulties.map(
                      (dif: string) => ({
                        dataKey: dif,
                        label: dif,
                        stack: "A",
                      }),
                    )}
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
                ) : (
                  <PieChart
                    series={[
                      {
                        data:
                          chartGrouping2 === "TEMA"
                            ? data.graficos.temas
                            : data.graficos.dificultades,
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
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            {/* Alumno y docente con más sesiones asignadas */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Estadísticas de Alumnos y Docentes
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Actores con mayor participación en sesiones de refuerzo
                </Typography>
                <Stack spacing={2}>
                  <ReportTextualCard
                    icon={<PersonIcon />}
                    title="Alumno con más sesiones"
                    value={data.tops.alumno.name}
                    description={
                      <>
                        Tiene <b>{data.tops.alumno.count}</b> sesiones
                        asignadas.
                      </>
                    }
                    color="primary"
                  />
                  <ReportTextualCard
                    icon={<SchoolIcon />}
                    title="Docente que más asigna"
                    value={data.tops.docente.name}
                    description={
                      <>
                        Ha asignado <b>{data.tops.docente.count}</b> sesiones.
                      </>
                    }
                    color="secondary"
                  />
                </Stack>
              </Paper>
            </Grid>

            {/* Efectividad Comparativa */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Efectividad de Sesiones Completadas
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Análisis del impacto en la reducción de dificultad según el
                  origen de la sesión.
                </Typography>

                <Grid container spacing={3}>
                  {/* Sistema */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={3}
                      sx={{ p: 2, borderTop: "4px solid #9c27b0" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={1}
                      >
                        <AutoAwesomeIcon sx={{ color: "#9c27b0" }} />
                        <Typography variant="h6">
                          Generadas por Sistema
                        </Typography>
                      </Stack>

                      <Typography variant="body2" gutterBottom>
                        Total de sesiones completadas:{" "}
                        <b>{data.efectividad.sistema.total}</b>
                      </Typography>

                      <Stack spacing={2} mt={2}>
                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Total (≥ 85% aciertos)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.sistema.level3,
                                data.efectividad.sistema.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.sistema.level3,
                              data.efectividad.sistema.total,
                            )}
                            color="success"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.sistema.level3} sesiones
                            establecieron la dificultad del alumno a grado
                            "Ninguna".
                          </Typography>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Significativa (60% - 84% aciertos)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.sistema.level2,
                                data.efectividad.sistema.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.sistema.level2,
                              data.efectividad.sistema.total,
                            )}
                            color="primary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.sistema.level2} sesiones
                            establecieron la dificultad del alumno a grado
                            "Bajo".
                          </Typography>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Leve (40% - 59% aciertos)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.sistema.level1,
                                data.efectividad.sistema.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.sistema.level1,
                              data.efectividad.sistema.total,
                            )}
                            color="warning"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.sistema.level1} sesiones
                            establecieron la dificultad del alumno a grado
                            "Medio".
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Docente */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={3}
                      sx={{ p: 2, borderTop: "4px solid #ff9800" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={1}
                      >
                        <PsychologyIcon sx={{ color: "#ff9800" }} />
                        <Typography variant="h6">
                          Asignadas por Docentes
                        </Typography>
                      </Stack>

                      <Typography variant="body2" gutterBottom>
                        Total completadas:{" "}
                        <b>{data.efectividad.docente.total}</b>
                      </Typography>

                      <Stack spacing={2} mt={2}>
                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Total (≥ 85% aciertos)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.docente.level3,
                                data.efectividad.docente.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.docente.level3,
                              data.efectividad.docente.total,
                            )}
                            color="success"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.docente.level3} sesiones
                            establecieron la dificultad del alumno a grado
                            "Ninguna".
                          </Typography>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Significativa (60% - 84%)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.docente.level2,
                                data.efectividad.docente.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.docente.level2,
                              data.efectividad.docente.total,
                            )}
                            color="primary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.docente.level2} sesiones
                            establecieron la dificultad del alumno a grado
                            "Bajo".
                          </Typography>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="caption">
                              Mejora Leve (40% - 59%)
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {calcPct(
                                data.efectividad.docente.level1,
                                data.efectividad.docente.total,
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={calcPct(
                              data.efectividad.docente.level1,
                              data.efectividad.docente.total,
                            )}
                            color="warning"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.efectividad.docente.level1} sesiones
                            establecieron la dificultad del alumno a grado
                            "Medio".
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Paper>
  );
}
