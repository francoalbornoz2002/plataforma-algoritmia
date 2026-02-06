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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  type SelectChangeEvent,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import TableOnIcon from "@mui/icons-material/TableChart";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
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
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";

interface Props {
  courseId: string;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

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
  const [selectedDificultadesIds, setSelectedDificultadesIds] = useState<
    string[]
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
        if (summary && summary.distribucionGrados) {
          const diffs = summary.distribucionGrados.map((d: any) => ({
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

  // Filtrar dificultades según temas seleccionados
  const filteredDifficulties =
    selectedTemas.length > 0
      ? availableDifficulties.filter((d) =>
          selectedTemas.includes(d.tema as temas),
        )
      : availableDifficulties;

  // 2. Sincronizar filtros de UI con el filtro de la API
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      temas: selectedTemas.join(","),
      dificultades: selectedDificultadesIds.join(","),
    }));
  }, [selectedTemas, selectedDificultadesIds]);

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

  const handleQuickFilter = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaDesde: start,
      fechaHasta: end,
    }));
  };

  const handleTemasChange = (
    event: SelectChangeEvent<typeof selectedTemas>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedTemas(
      typeof value === "string" ? (value.split(",") as temas[]) : value,
    );
  };

  const handleDificultadesChange = (
    event: SelectChangeEvent<typeof selectedDificultadesIds>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedDificultadesIds(
      typeof value === "string" ? value.split(",") : value,
    );
  };

  const handleClearFilters = () => {
    setFilters({ ...filters, fechaDesde: "", fechaHasta: "", fuente: "" });
    setSelectedTemas([]);
    setSelectedDificultadesIds([]);
  };

  // --- Columnas Tabla ---
  const columns: GridColDef[] = [
    {
      field: "fechaCambio",
      headerName: "Fecha",
      width: 180,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "dd/MM/yyyy hh:mm a") : "-",
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
      field: "gradoAnterior",
      headerName: "Grado Anterior",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || "Ninguno"}
          size="small"
          variant="filled"
          color={
            params.value === grado_dificultad.Alto
              ? "error"
              : params.value === grado_dificultad.Bajo
                ? "success"
                : params.value === grado_dificultad.Medio
                  ? "warning"
                  : "default"
          }
        />
      ),
    },
    {
      field: "gradoNuevo",
      headerName: "Grado Nuevo",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || "Ninguno"}
          size="small"
          color={
            params.value === grado_dificultad.Alto
              ? "error"
              : params.value === grado_dificultad.Bajo
                ? "success"
                : params.value === grado_dificultad.Medio
                  ? "warning"
                  : "default"
          }
        />
      ),
    },
    {
      field: "trend",
      headerName: "Mejora",
      width: 70,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const anterior = params.row.gradoAnterior || "Ninguno";
        const nuevo = params.row.gradoNuevo || "Ninguno";
        const weights: Record<string, number> = {
          Ninguno: 0,
          Bajo: 1,
          Medio: 2,
          Alto: 3,
        };
        const wOld = weights[anterior] || 0;
        const wNew = weights[nuevo] || 0;

        if (wOld > wNew) return <TrendingUpIcon color="success" />; // Mejora
        if (wOld < wNew) return <TrendingDownIcon color="error" />; // Empeora
        return null;
      },
    },
    {
      field: "fuente",
      headerName: "Fuente",
      width: 120,
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

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
        >
          Historial de Dificultades
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/dificultades/historial/pdf`}
            disabled={!data || data.tabla.length === 0}
          />
          <Button
            variant="outlined"
            startIcon={<TableOnIcon />}
            disabled={!data || data.tabla.length === 0}
            color="success"
          >
            Exportar Excel
          </Button>
        </Box>
      </Stack>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Fila 1: Filtros Rápidos */}
          <QuickDateFilter onApply={handleQuickFilter} />

          <Divider />

          {/* Fila 2: Fechas, Fuente, Temas y Dificultades */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
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
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
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
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />

            <FormControl size="small" sx={{ minWidth: 190 }}>
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

            <FormControl size="small" sx={{ width: 250 }}>
              <InputLabel id="temas-select-label">Filtrar por Temas</InputLabel>
              <Select
                labelId="temas-select-label"
                multiple
                value={selectedTemas}
                onChange={handleTemasChange}
                input={<OutlinedInput label="Filtrar por Temas" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {Object.values(temas)
                  .filter((t) => t !== "Ninguno")
                  .map((t) => (
                    <MenuItem key={t} value={t}>
                      <Checkbox checked={selectedTemas.indexOf(t) > -1} />
                      <ListItemText primary={t} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 300 }}>
              <InputLabel id="dificultades-select-label">
                Filtrar por Dificultades
              </InputLabel>
              <Select
                labelId="dificultades-select-label"
                multiple
                value={selectedDificultadesIds}
                onChange={handleDificultadesChange}
                input={<OutlinedInput label="Filtrar por Dificultades" />}
                renderValue={(selected) => {
                  const names = selected.map(
                    (id) =>
                      filteredDifficulties.find((d) => d.id === id)?.nombre ||
                      id,
                  );
                  return names.join(", ");
                }}
                MenuProps={MenuProps}
              >
                {filteredDifficulties.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Checkbox
                      checked={selectedDificultadesIds.indexOf(d.id) > -1}
                    />
                    <ListItemText primary={d.nombre} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="text" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && !data && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}

      {data && (
        <Grid container spacing={2}>
          {/* --- Gráfico de Línea --- */}
          <Grid size={12}>
            <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Evolución de Registros de Dificultad
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cantidad de registros o actualización de grado dificultad segun
                origen y agrupado por fecha.
              </Typography>
              {data.timeline.length > 0 ? (
                <LineChart
                  xAxis={[
                    {
                      scaleType: "point",
                      data: data.timeline.map((t: any) => t.fecha),
                      label: "Fecha",
                      valueFormatter: (date) => {
                        const [y, m, d] = date.split("-");
                        return `${d}/${m}/${y}`;
                      },
                    },
                  ]}
                  series={[
                    {
                      data: data.timeline.map((t: any) => t.videojuego),
                      label: "Videojuego",
                      color: "#1976d2",
                      curve: "linear",
                    },
                    {
                      data: data.timeline.map((t: any) => t.sesion_refuerzo),
                      label: "Sesiones",
                      color: "#9c27b0",
                      curve: "linear",
                    },
                  ]}
                  height={350}
                  margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
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
          {/* --- Fuente de Mejora (Barras y Tabla) --- */}
          <Grid size={12}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                bgcolor: "primary.50",
                height: "100%",
              }}
            >
              <Typography variant="h6">Fuente de Mejora</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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

                <Box sx={{ height: 400, width: "100%", mt: 2 }}>
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
                    pageSizeOptions={[10, 25]}
                    sx={{
                      "& .MuiDataGrid-cell": {
                        fontSize: "0.75rem",
                      },
                      "& .MuiDataGrid-columnHeader": {
                        fontSize: "0.75rem",
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}
