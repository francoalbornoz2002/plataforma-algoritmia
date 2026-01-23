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
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCourseMissionDetailReport,
  type CourseMissionDetailReportFilters,
} from "../service/reports.service";
import { dificultad_mision } from "../../../types";
import { useOptionalCourseContext } from "../../../context/CourseContext";

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

  // Cargar lista de misiones o datos específicos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseMissionDetailReport(courseId, filters);

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

  const columns: GridColDef[] = [
    { field: "alumno", headerName: "Alumno", flex: 1 },
    { field: "estrellas", headerName: "Estrellas", width: 100 },
    { field: "exp", headerName: "Exp", width: 100 },
    { field: "intentos", headerName: "Intentos", width: 100 },
    {
      field: "fecha",
      headerName: "Fecha",
      width: 150,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
  ];

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Detalle por Misión
      </Typography>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
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
        <Stack spacing={3}>
          {/* Stats Rápidos */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {data.mision.nombre}
            </Typography>
            <Stack
              direction="row"
              spacing={4}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box>
                <Typography variant="caption">Veces Completada</Typography>
                <Typography variant="h5">
                  {data.stats.vecesCompletada}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption">Alumnos Únicos</Typography>
                <Typography variant="h5">
                  {data.stats.alumnosCompletaron} (
                  {data.stats.pctAlumnos.toFixed(1)}%)
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption">Prom. Estrellas</Typography>
                <Typography variant="h5" color="warning.main">
                  {data.stats.promEstrellas.toFixed(1)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption">Prom. Intentos</Typography>
                <Typography variant="h5" color="info.main">
                  {data.stats.promIntentos.toFixed(1)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            {/* Gráfico */}
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Frecuencia de Completado
                </Typography>
                {data.grafico.length > 0 ? (
                  <LineChart
                    xAxis={[
                      { scaleType: "point", dataKey: "fecha", label: "Fecha" },
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
            </Box>

            {/* Tabla */}
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ height: 400, width: "100%" }}>
                <DataGrid
                  rows={data.tabla}
                  columns={columns}
                  loading={loading}
                  density="compact"
                  disableRowSelectionOnClick
                />
              </Paper>
            </Box>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
