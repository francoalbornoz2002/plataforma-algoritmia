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
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import WarningIcon from "@mui/icons-material/Warning";
import TopicIcon from "@mui/icons-material/Topic";
import { PieChart } from "@mui/x-charts/PieChart";

import {
  getCourseSessionsSummary,
  type CourseSessionsSummaryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";

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
      <Typography
        variant="h5"
        gutterBottom
        color="primary.main"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Resumen de Sesiones de Refuerzo
      </Typography>

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
        <Stack spacing={4}>
          {/* Fila 1: KPIs Generales */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Sesiones Generadas
                  </Typography>
                  <Typography
                    variant="h3"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    {data.kpis.total}
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
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Estado de Sesiones
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Completadas</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {data.kpis.estados.Completada}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">En Curso</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="warning.main"
                    >
                      {data.kpis.estados.En_curso}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Pendientes</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="info.main"
                    >
                      {data.kpis.estados.Pendiente}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">No Completadas</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="error.main"
                    >
                      {data.kpis.estados.No_completada}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Origen de Asignación
                </Typography>
                <Box height={150} width="100%">
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            label: "Sistema",
                            value: data.kpis.origen.sistema,
                            color: "#9c27b0",
                          },
                          {
                            label: "Docente",
                            value: data.kpis.origen.docente,
                            color: "#ff9800",
                          },
                        ],
                        innerRadius: 30,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                    margin={{ top: 0, bottom: 20, left: 0, right: 0 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          {/* Fila 2: Tops y Modas */}
          <Typography variant="h6" color="text.secondary">
            Estadísticas Destacadas
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <PersonIcon color="primary" fontSize="large" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Alumno con más sesiones
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {data.tops.alumno.name}
                  </Typography>
                  <Chip
                    label={`${data.tops.alumno.count} sesiones`}
                    size="small"
                  />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <SchoolIcon color="secondary" fontSize="large" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Docente que más asigna
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {data.tops.docente.name}
                  </Typography>
                  <Chip
                    label={`${data.tops.docente.count} asignadas`}
                    size="small"
                  />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <WarningIcon color="error" fontSize="large" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Dificultad más frecuente
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {data.tops.dificultad.name}
                  </Typography>
                  <Chip
                    label={`${data.tops.dificultad.count} sesiones`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <TopicIcon color="info" fontSize="large" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Tema más frecuente
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {data.tops.tema.label}
                  </Typography>
                  <Chip
                    label={`${data.tops.tema.value} sesiones`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          {/* Fila 3: Efectividad Comparativa */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Efectividad de Sesiones Completadas
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Análisis del impacto en la reducción de dificultad según el origen
              de la sesión.
            </Typography>

            <Grid container spacing={3}>
              {/* Sistema */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={3}
                  sx={{ p: 3, borderTop: "4px solid #9c27b0" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <AutoAwesomeIcon sx={{ color: "#9c27b0" }} />
                    <Typography variant="h6">Generadas por Sistema</Typography>
                  </Stack>

                  <Typography variant="body2" gutterBottom>
                    Total completadas: <b>{data.efectividad.sistema.total}</b>
                  </Typography>

                  <Stack spacing={2} mt={2}>
                    <Box>
                      <Box
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
                      </Box>
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
                        {data.efectividad.sistema.level3} sesiones redujeron la
                        dificultad a "Ninguna".
                      </Typography>
                    </Box>

                    <Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}
                      >
                        <Typography variant="caption">
                          Mejora Significativa (60% - 84%)
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {calcPct(
                            data.efectividad.sistema.level2,
                            data.efectividad.sistema.total,
                          ).toFixed(1)}
                          %
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calcPct(
                          data.efectividad.sistema.level2,
                          data.efectividad.sistema.total,
                        )}
                        color="primary"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}
                      >
                        <Typography variant="caption">
                          Mejora Leve (40% - 59%)
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {calcPct(
                            data.efectividad.sistema.level1,
                            data.efectividad.sistema.total,
                          ).toFixed(1)}
                          %
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calcPct(
                          data.efectividad.sistema.level1,
                          data.efectividad.sistema.total,
                        )}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Docente */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={3}
                  sx={{ p: 3, borderTop: "4px solid #ff9800" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <PsychologyIcon sx={{ color: "#ff9800" }} />
                    <Typography variant="h6">Asignadas por Docentes</Typography>
                  </Stack>

                  <Typography variant="body2" gutterBottom>
                    Total completadas: <b>{data.efectividad.docente.total}</b>
                  </Typography>

                  <Stack spacing={2} mt={2}>
                    <Box>
                      <Box
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
                      </Box>
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
                        {data.efectividad.docente.level3} sesiones redujeron la
                        dificultad a "Ninguna".
                      </Typography>
                    </Box>

                    <Box>
                      <Box
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
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calcPct(
                          data.efectividad.docente.level2,
                          data.efectividad.docente.total,
                        )}
                        color="primary"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box>
                      <Box
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
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calcPct(
                          data.efectividad.docente.level1,
                          data.efectividad.docente.total,
                        )}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
