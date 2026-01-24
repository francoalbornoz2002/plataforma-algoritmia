import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  Divider,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Grid,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCourseDifficultiesHistory,
  getCourseDifficultiesReport,
  type CourseDifficultiesHistoryFilters,
} from "../../service/reports.service";
import {
  temas,
  fuente_cambio_dificultad,
  grado_dificultad,
} from "../../../../types";

interface Props {
  courseId: string;
}

export default function CourseDifficultiesHistory({ courseId }: Props) {
  // --- Estados de Filtros ---
  const [filters, setFilters] = useState<CourseDifficultiesHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    fuente: "",
    temas: "",
    dificultades: "",
  });

  // Estados para selectores múltiples (UI)
  const [selectedTemas, setSelectedTemas] = useState<temas[]>([]);
  const [selectedDificultades, setSelectedDificultades] = useState<
    { id: string; nombre: string }[]
  >([]);

  // --- Estados de Datos ---
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Lista de dificultades disponibles para el filtro (se carga al montar)
  const [availableDifficulties, setAvailableDifficulties] = useState<
    { id: string; nombre: string; tema: string }[]
  >([]);

  // --- Efectos ---

  // 1. Cargar lista de dificultades del curso (usando el reporte resumen como fuente)
  useEffect(() => {
    const loadDifficulties = async () => {
      try {
        // Usamos el reporte resumen para obtener las dificultades existentes en el curso
        const summary = await getCourseDifficultiesReport(courseId, {});
        if (summary && summary.tabla) {
          const diffs = summary.tabla.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            tema: d.tema,
          }));
          setAvailableDifficulties(diffs);
        }
      } catch (err) {
        console.error("Error cargando lista de dificultades", err);
      }
    };
    loadDifficulties();
  }, [courseId]);

  // 2. Sincronizar filtros de UI con el filtro de la API
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      temas: selectedTemas.join(","),
      dificultades: selectedDificultades.map((d) => d.id).join(","),
    }));
  }, [selectedTemas, selectedDificultades]);

  // 3. Cargar Historial
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, courseId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCourseDifficultiesHistory(courseId, filters);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de dificultades.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setFilters((prev) => ({
      ...prev,
      fechaDesde: format(start, "yyyy-MM-dd"),
      fechaHasta: format(end, "yyyy-MM-dd"),
    }));
  };

  const applyMonthFilter = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1);
    setFilters((prev) => ({
      ...prev,
      fechaDesde: format(start, "yyyy-MM-dd"),
      fechaHasta: format(end, "yyyy-MM-dd"),
    }));
  };

  // --- Columnas Tabla ---
  const columns: GridColDef[] = [
    {
      field: "fechaCambio",
      headerName: "Fecha",
      width: 150,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString() : "-",
    },
    {
      field: "alumno",
      headerName: "Alumno",
      flex: 1,
      minWidth: 180,
      valueGetter: (params, row) =>
        row.alumno ? `${row.alumno.nombre} ${row.alumno.apellido}` : "-",
    },
    {
      field: "dificultad",
      headerName: "Dificultad",
      flex: 1,
      minWidth: 150,
      valueGetter: (params, row) => row.dificultad?.nombre || "-",
    },
    {
      field: "tema",
      headerName: "Tema",
      width: 120,
      valueGetter: (params, row) => row.dificultad?.tema || "-",
    },
    {
      field: "cambio",
      headerName: "Cambio de Grado",
      width: 200,
      renderCell: (params) => {
        const anterior = params.row.gradoAnterior || "Ninguno";
        const nuevo = params.row.gradoNuevo || "Ninguno";
        const esMejora = isImprovement(anterior, nuevo);

        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={anterior}
              size="small"
              variant="outlined"
              color="default"
            />
            <Typography variant="body2">→</Typography>
            <Chip
              label={nuevo}
              size="small"
              color={
                nuevo === grado_dificultad.Alto
                  ? "error"
                  : nuevo === grado_dificultad.Bajo
                    ? "success"
                    : "warning"
              }
            />
            {esMejora && (
              <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
            )}
          </Stack>
        );
      },
    },
    {
      field: "fuente",
      headerName: "Fuente",
      width: 150,
      renderCell: (params) => {
        const isGame = params.value === fuente_cambio_dificultad.VIDEOJUEGO;
        return (
          <Chip
            icon={isGame ? <VideogameAssetIcon /> : <SchoolIcon />}
            label={isGame ? "Videojuego" : "Sesión"}
            color={isGame ? "primary" : "secondary"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
  ];

  // Helper para detectar mejora visualmente en la tabla
  const isImprovement = (oldG: string, newG: string) => {
    const weights: Record<string, number> = {
      Ninguno: 0,
      Bajo: 1,
      Medio: 2,
      Alto: 3,
    };
    return (weights[oldG] || 0) > (weights[newG] || 0);
  };

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Historial de Dificultades
      </Typography>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Fila 1: Filtros Rápidos y Fuente */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Filtros Rápidos de Tiempo
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={() => applyQuickFilter(3)}>3 Días</Button>
                <Button onClick={() => applyQuickFilter(5)}>5 Días</Button>
                <Button onClick={() => applyQuickFilter(7)}>1 Semana</Button>
                <Button onClick={applyMonthFilter}>1 Mes</Button>
              </ButtonGroup>
            </Box>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Fuente de Registro</InputLabel>
              <Select
                value={filters.fuente}
                label="Fuente de Registro"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    fuente: e.target.value as any,
                  })
                }
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value={fuente_cambio_dificultad.VIDEOJUEGO}>
                  Videojuego
                </MenuItem>
                <MenuItem value={fuente_cambio_dificultad.SESION_REFUERZO}>
                  Sesión de Refuerzo
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {/* Fila 2: Fechas, Temas y Dificultades */}
          <Grid container spacing={2} alignItems="center">
            <Grid sx={{ xs: 12, md: 3 }}>
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
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
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
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Autocomplete
                multiple
                options={Object.values(temas).filter((t) => t !== "Ninguno")}
                value={selectedTemas}
                onChange={(_, newValue) => setSelectedTemas(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por Temas"
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Autocomplete
                multiple
                options={availableDifficulties}
                getOptionLabel={(option) => option.nombre}
                value={selectedDificultades}
                onChange={(_, newValue) => setSelectedDificultades(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por Dificultades"
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {/* --- Acciones Exportar --- */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!data || data.tabla.length === 0}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={!data || data.tabla.length === 0}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && !data && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}

      {data && (
        <Stack spacing={3}>
          {/* --- Sección Superior: KPI y Gráfico --- */}
          <Grid container spacing={3}>
            {/* KPI: Fuente de Mejora */}
            <Grid sx={{ xs: 12, md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  bgcolor: "primary.50",
                }}
              >
                <Typography variant="h6" gutterBottom color="primary.main">
                  Fuente de Mejora
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Porcentaje de registros donde el alumno disminuyó su grado de
                  dificultad (mejoró).
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <VideogameAssetIcon color="primary" />
                        <Typography variant="subtitle2">Videojuego</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="bold">
                        {data.stats.porcentajeVideojuego.toFixed(1)}%
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        width: "100%",
                        height: 8,
                        bgcolor: "grey.300",
                        borderRadius: 1,
                        mt: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${data.stats.porcentajeVideojuego}%`,
                          height: "100%",
                          bgcolor: "primary.main",
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolIcon color="secondary" />
                        <Typography variant="subtitle2">Sesiones</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="bold">
                        {data.stats.porcentajeSesion.toFixed(1)}%
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        width: "100%",
                        height: 8,
                        bgcolor: "grey.300",
                        borderRadius: 1,
                        mt: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${data.stats.porcentajeSesion}%`,
                          height: "100%",
                          bgcolor: "secondary.main",
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="caption" align="center" sx={{ mt: 2 }}>
                    Total de mejoras registradas:{" "}
                    <strong>{data.stats.totalMejoras}</strong>
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* Gráfico de Línea */}
            <Grid sx={{ xs: 12, md: 8 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Evolución de Registros
                </Typography>
                {data.timeline.length > 0 ? (
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: data.timeline.map((t: any) => t.fecha),
                        label: "Fecha",
                        valueFormatter: (date) =>
                          new Date(date).toLocaleDateString(),
                      },
                    ]}
                    series={[
                      {
                        data: data.timeline.map((t: any) => t.videojuego),
                        label: "Videojuego",
                        color: "#1976d2",
                        showMark: false,
                      },
                      {
                        data: data.timeline.map((t: any) => t.sesion_refuerzo),
                        label: "Sesiones",
                        color: "#9c27b0",
                        showMark: false,
                      },
                    ]}
                    height={300}
                    margin={{ left: 40, right: 40, top: 20, bottom: 30 }}
                  />
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={250}
                  >
                    <Typography color="text.secondary">
                      No hay datos para el periodo seleccionado.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* --- Tabla Detalle --- */}
          <Paper elevation={3} sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={data.tabla}
              columns={columns}
              getRowId={(row) => row.id}
              density="compact"
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: {
                  sortModel: [{ field: "fechaCambio", sort: "desc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </Paper>
        </Stack>
      )}
    </Paper>
  );
}
