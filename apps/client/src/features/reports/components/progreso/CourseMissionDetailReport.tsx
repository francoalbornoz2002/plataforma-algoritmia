import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parse } from "date-fns";
import TableOnIcon from "@mui/icons-material/TableChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCourseMissionDetailReport,
  type CourseMissionDetailReportFilters,
} from "../../service/reports.service";
import { dificultad_mision } from "../../../../types";
import { useOptionalCourseContext } from "../../../../context/CourseContext";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";
import ReportStatCard from "../common/ReportStatCard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PersonIcon from "@mui/icons-material/Person";
import StarIcon from "@mui/icons-material/Star";
import ReplayIcon from "@mui/icons-material/Replay";

interface Props {
  courseId: string;
}

export default function CourseMissionDetailReport({ courseId }: Props) {
  const [filters, setFilters] = useState<CourseMissionDetailReportFilters>({
    misionId: "",
    dificultad: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [missionsList, setMissionsList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const courseContext = useOptionalCourseContext();

  const courseCreatedAt =
    courseContext?.selectedCourse?.id === courseId
      ? courseContext?.selectedCourse?.createdAt
      : undefined;

  const maxCantidad =
    data?.grafico && data.grafico.length > 0
      ? Math.max(...data.grafico.map((d: any) => d.cantidad), 0)
      : 0;

  // Cargar lista de misiones o datos específicos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result: any = await getCourseMissionDetailReport(
          courseId,
          filters,
        );

        if (!filters.misionId) {
          // Si no hay misión seleccionada, el backend devuelve la lista
          setMissionsList(result.misionesDisponibles || []);
          setData(null);
        } else {
          // Si hay misión, devuelve el detalle
          setData(result);
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, filters]);

  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const columns: GridColDef[] = [
    { field: "alumno", headerName: "Alumno", flex: 1 },
    { field: "estrellas", headerName: "Estrellas", width: 80 },
    { field: "exp", headerName: "Exp", width: 80 },
    { field: "intentos", headerName: "Intentos", width: 80 },
    {
      field: "fecha",
      headerName: "Fecha Completado",
      width: 150,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
  ];

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
        >
          {data
            ? `Detalle por Misión: ${data.mision.nombre}`
            : "Detalle por Misión"}
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/progreso/detalle-mision/pdf`}
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
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Dificultad (Filtro)</InputLabel>
            <Select
              value={filters.dificultad}
              label="Dificultad (Filtro)"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dificultad: e.target.value as any,
                  misionId: "",
                })
              }
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value={dificultad_mision.Facil}>Fácil</MenuItem>
              <MenuItem value={dificultad_mision.Medio}>Medio</MenuItem>
              <MenuItem value={dificultad_mision.Dificil}>Difícil</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Seleccionar Misión</InputLabel>
            <Select
              value={filters.misionId}
              label="Seleccionar Misión"
              onChange={(e) =>
                setFilters({ ...filters, misionId: e.target.value })
              }
            >
              <MenuItem value="">-- Seleccione --</MenuItem>
              {missionsList.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.nombre} ({m.dificultadMision})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Desde"
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
            slotProps={{ textField: { size: "small" } }}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
          />
          <DatePicker
            label="Hasta"
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
            slotProps={{ textField: { size: "small" } }}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!filters.misionId && (
        <Alert severity="info">
          Seleccione una misión para ver los detalles.
        </Alert>
      )}

      {data && (
        <Stack spacing={2}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas generales
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportStatCard
                  icon={<TaskAltIcon fontSize="small" />}
                  title="Veces Completada"
                  subtitle="Total de ejecuciones"
                  count={data.stats.vecesCompletada}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportStatCard
                  icon={<PersonIcon fontSize="small" />}
                  title="Alumnos que completaron"
                  subtitle="Total de alumnos distintos"
                  count={data.stats.alumnosCompletaron}
                  percentage={data.stats.pctAlumnos}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportStatCard
                  icon={<StarIcon fontSize="small" />}
                  title="Prom. Estrellas"
                  subtitle="Calificación promedio"
                  count={data.stats.promEstrellas.toFixed(1)}
                  color="warning"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportStatCard
                  icon={<ReplayIcon fontSize="small" />}
                  title="Prom. Intentos"
                  subtitle="Intentos promedio"
                  count={data.stats.promIntentos.toFixed(1)}
                  color="info"
                />
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            {/* Gráfico */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Frecuencia de Completado
                </Typography>
                {data.grafico.length > 0 ? (
                  <LineChart
                    yAxis={[
                      {
                        label: "Cantidad de misiones",
                        valueFormatter: (value: number) =>
                          Number.isInteger(value) ? value.toString() : "",
                        min: 0,
                        max: maxCantidad < 5 ? 5 : undefined,
                      },
                    ]}
                    xAxis={[
                      {
                        scaleType: "point",
                        dataKey: "fecha",
                        label: "Fecha",
                        valueFormatter: (date: string) =>
                          format(
                            parse(date, "yyyy-MM-dd", new Date()),
                            "dd/MM",
                          ),
                      },
                    ]}
                    series={[
                      {
                        dataKey: "cantidad",
                        label: "Completados",
                        color: "#2e7d32",
                      },
                    ]}
                    dataset={data.grafico}
                    height={300}
                  />
                ) : (
                  <Typography
                    color="text.secondary"
                    align="center"
                    sx={{ py: 4 }}
                  >
                    Sin datos en el periodo seleccionado
                  </Typography>
                )}
              </Paper>
            </Grid>
            {/* Tabla */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: 400,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Alumnos que la completaron
                </Typography>
                <DataGrid
                  rows={data.tabla}
                  columns={columns}
                  loading={loading}
                  density="compact"
                  disableRowSelectionOnClick
                  sx={{ flex: 1 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Paper>
  );
}
