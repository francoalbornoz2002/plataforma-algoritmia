import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import PercentIcon from "@mui/icons-material/Percent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonIcon from "@mui/icons-material/Person";
import { LineChart } from "@mui/x-charts/LineChart";

import {
  getCourseProgressSummary,
  type CourseProgressSummaryFilters,
} from "../../service/reports.service";
import { useOptionalCourseContext } from "../../../../context/CourseContext";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportStatCard from "../common/ReportStatCard";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import { Assessment } from "@mui/icons-material";

interface Props {
  courseId: string;
}

export default function CourseProgressSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseProgressSummaryFilters>({
    fechaCorte: "",
  });
  const courseContext = useOptionalCourseContext();

  // Obtenemos la fecha de creación del curso desde el contexto si coincide con el curso actual
  const courseCreatedAt =
    courseContext?.selectedCourse?.id === courseId
      ? courseContext?.selectedCourse?.createdAt
      : undefined;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseProgressSummary(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de progreso.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  const handleClearFilter = () => {
    setFilters({ fechaCorte: "" });
  };

  // Si está cargando y no hay data previa, mostramos spinner
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
          title="Resumen de Progreso"
          description="Consulta el reporte resumen de progreso del curso hasta una fecha en específico"
          icon={<Assessment />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/progreso/resumen/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/progreso/resumen/excel`}
          filenameExcel="resumen_progreso.xlsx"
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
              setFilters({ fechaCorte: val ? format(val, "yyyy-MM-dd") : "" })
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

        {showLoading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {data && !showLoading && (
          <Stack spacing={2}>
            {/* Fila 1: Tarjetas de Resumen */}
            <Grid container spacing={2}>
              {/* Progreso Total */}
              <Grid size={{ xs: 12, md: 3 }}>
                <ReportTotalCard
                  resourceName="Progreso del Curso"
                  total={`${data.resumen.progresoTotal.toFixed(1)}%`}
                  active={data.resumen.totalAlumnos}
                  inactive={data.resumen.totalAlumnosInactivos}
                  icon={<PercentIcon fontSize="small" />}
                  activeLabelPrefix="Alumnos"
                />
              </Grid>

              {/* Misiones */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <ReportStatCard
                  icon={<TaskAltIcon fontSize="small" />}
                  title="Misiones completadas"
                  subtitle="Acumuladas por el curso"
                  count={data.resumen.misionesCompletadas}
                  color="info"
                />
              </Grid>

              {/* Estrellas */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <ReportStatCard
                  icon={<StarIcon fontSize="small" />}
                  title="Estrellas totales"
                  subtitle="Acumuladas por el curso"
                  count={data.resumen.estrellasTotales}
                  color="warning"
                />
              </Grid>

              {/* Intentos */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <ReportStatCard
                  icon={<ReplayIcon fontSize="small" />}
                  title="Intentos totales"
                  subtitle="Acumulados por el curso"
                  count={data.resumen.intentosTotales}
                  color="secondary"
                />
              </Grid>

              {/* Exp */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportStatCard
                  icon={<BoltIcon fontSize="small" />}
                  title="Experiencia total"
                  subtitle="Puntos EXP acumulados por el curso"
                  count={data.resumen.expTotal}
                  color="primary"
                />
              </Grid>
            </Grid>

            {/* Fila 2: Gráfico y Estadísticas Detalladas */}
            <Grid container spacing={2}>
              {/* Gráfico */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Evolución del Progreso
                  </Typography>

                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      minHeight: 250,
                    }}
                  >
                    {data.evolucion && data.evolucion.length > 0 ? (
                      <LineChart
                        xAxis={[
                          {
                            dataKey: "fecha",
                            label: "Fecha",
                            scaleType: "point",
                            valueFormatter: (date) =>
                              format(new Date(date), "dd/MM"),
                          },
                        ]}
                        yAxis={[
                          {
                            label: "Progreso (%)",
                            min: 0,
                            max: 100,
                            tickNumber: 11,
                          },
                        ]}
                        series={[
                          {
                            dataKey: "progreso",
                            label: "Progreso (%)",
                            color: "#4caf50",
                            area: true,
                            showMark: true,
                          },
                        ]}
                        dataset={data.evolucion.map((e: any) => ({
                          ...e,
                          fecha: new Date(e.fecha),
                        }))}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        display="block"
                        sx={{ py: 4 }}
                      >
                        No hay datos históricos suficientes.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Estadísticas de Alumnos */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  {/* Promedios */}
                  <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" gutterBottom>
                        Estadísticas por alumno
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <ReportStatCard
                            icon={<StarIcon fontSize="small" />}
                            title="Estrellas"
                            subtitle="Promedio por alumno"
                            count={data.resumen.promEstrellas.toFixed(1)}
                            color="warning"
                            small
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <ReportStatCard
                            icon={<ReplayIcon fontSize="small" />}
                            title="Intentos"
                            subtitle="Promedio por alumno"
                            count={data.resumen.promIntentos.toFixed(1)}
                            color="info"
                            small
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                  {/* Tops */}
                  <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={2}>
                      <Stack>
                        <Typography variant="h6">
                          Alumnos más activos e inactivos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Con porcentaje de diferencia respecto al promedio
                        </Typography>
                      </Stack>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                      >
                        {/* Top Activos */}
                        <Box sx={{ flex: 1 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            mb={1}
                          >
                            <TrendingUpIcon color="success" fontSize="small" />
                            <Typography
                              variant="subtitle2"
                              color="success.main"
                              fontWeight="bold"
                            >
                              Top 5 Más Activos
                            </Typography>
                          </Stack>
                          <List dense disablePadding>
                            {data.tops?.activos.map(
                              (student: any, index: number) => (
                                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemAvatar sx={{ minWidth: 36 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: "success.light",
                                        width: 24,
                                        height: 24,
                                      }}
                                    >
                                      <PersonIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={student.nombre}
                                    primaryTypographyProps={{
                                      variant: "body2",
                                      fontWeight: 500,
                                    }}
                                    secondary={
                                      <Typography
                                        variant="caption"
                                        component="span"
                                        sx={{
                                          fontSize: "0.7rem",
                                          lineHeight: 1,
                                        }}
                                      >
                                        <strong>{student.misiones}</strong>{" "}
                                        misiones completadas
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          color="success.main"
                                          sx={{
                                            ml: 0.5,
                                            fontWeight: "bold",
                                            fontSize: "0.7rem",
                                          }}
                                        >
                                          (+
                                          {student.diferenciaPorcentual.toFixed(
                                            0,
                                          )}
                                          % vs prom)
                                        </Typography>
                                      </Typography>
                                    }
                                    sx={{ m: 0 }}
                                  />
                                </ListItem>
                              ),
                            )}
                            {data.tops?.activos.length === 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                align="center"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                Sin datos
                              </Typography>
                            )}
                          </List>
                        </Box>

                        {/* Top Inactivos */}
                        <Box sx={{ flex: 1 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            mb={1}
                          >
                            <TrendingDownIcon color="error" fontSize="small" />
                            <Typography
                              variant="subtitle2"
                              color="error.main"
                              fontWeight="bold"
                            >
                              Top 5 Menos Activos
                            </Typography>
                          </Stack>
                          <List dense disablePadding>
                            {data.tops?.inactivos.map(
                              (student: any, index: number) => (
                                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemAvatar sx={{ minWidth: 36 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: "error.light",
                                        width: 24,
                                        height: 24,
                                      }}
                                    >
                                      <PersonIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={student.nombre}
                                    primaryTypographyProps={{
                                      variant: "body2",
                                      fontWeight: 500,
                                    }}
                                    secondary={
                                      <Typography
                                        variant="caption"
                                        component="span"
                                        sx={{
                                          fontSize: "0.7rem",
                                          lineHeight: 1,
                                        }}
                                      >
                                        <strong>{student.misiones}</strong>{" "}
                                        misiones completadas
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          color="error.main"
                                          sx={{
                                            ml: 0.5,
                                            fontWeight: "bold",
                                            fontSize: "0.7rem",
                                          }}
                                        >
                                          (
                                          {student.diferenciaPorcentual.toFixed(
                                            0,
                                          )}
                                          % vs prom)
                                        </Typography>
                                      </Typography>
                                    }
                                    sx={{ m: 0 }}
                                  />
                                </ListItem>
                              ),
                            )}
                            {data.tops?.inactivos.length === 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                align="center"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                Sin datos
                              </Typography>
                            )}
                          </List>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
