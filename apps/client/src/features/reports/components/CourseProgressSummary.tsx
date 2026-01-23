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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import PercentIcon from "@mui/icons-material/Percent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import GroupIcon from "@mui/icons-material/Group";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  getCourseProgressSummary,
  type CourseProgressSummaryFilters,
} from "../service/reports.service";
import { useOptionalCourseContext } from "../../../context/CourseContext";

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
  // Si hay data, mostramos la data vieja con opacidad o spinner overlay (opcional)
  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Resumen de Progreso del Curso
      </Typography>

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
              setFilters({ fechaCorte: val ? format(val, "yyyy-MM-dd") : "" })
            }
            slotProps={{ textField: { size: "small", sx: { width: 250 } } }}
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* KPIs */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PercentIcon color="success" />
                    <Typography variant="subtitle2" color="text.secondary">
                      {filters.fechaCorte
                        ? "Progreso a la fecha"
                        : "Progreso Total del Curso"}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h3"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    {data.resumen.progresoTotal.toFixed(1)}%
                  </Typography>
                </Box>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TaskAltIcon color="info" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Misiones Completadas
                      </Typography>
                    </Stack>
                    <Typography variant="h6">
                      {data.resumen.misionesCompletadas}
                    </Typography>
                  </Box>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GroupIcon color="action" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Alumnos Activos
                      </Typography>
                    </Stack>
                    <Typography variant="h6">
                      {data.resumen.totalAlumnos}
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <StarIcon color="warning" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Estrellas
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold">
                      {data.resumen.estrellasTotales}
                    </Typography>
                  </Box>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <BoltIcon color="primary" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Exp Total
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold">
                      {data.resumen.expTotal}
                    </Typography>
                  </Box>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ReplayIcon color="action" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Intentos
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold">
                      {data.resumen.intentosTotales}
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Promedios por Alumno
                  </Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon color="warning" fontSize="inherit" />
                        <Typography variant="caption">Estrellas</Typography>
                      </Stack>
                      <Typography variant="h6" color="warning.main">
                        {data.resumen.promEstrellas.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ReplayIcon color="info" fontSize="inherit" />
                        <Typography variant="caption">Intentos</Typography>
                      </Stack>
                      <Typography variant="h6" color="info.main">
                        {data.resumen.promIntentos.toFixed(1)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* Gráfico */}
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Estado Global
              </Typography>
              <PieChart
                series={[
                  {
                    data: data.grafico,
                    highlightScope: { fade: "global", highlight: "item" },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                  },
                ]}
                height={250}
                width={400}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "bottom", horizontal: "center" },
                  },
                }}
              />
            </Paper>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
