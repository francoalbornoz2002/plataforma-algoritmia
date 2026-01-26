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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Autocomplete,
  TextField,
  ButtonGroup,
  Chip,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";

import {
  getCourseConsultationsHistory,
  type CourseConsultationsHistoryFilters,
} from "../../service/reports.service";
import { getStudentProgressList } from "../../../users/services/docentes.service";
import { useDebounce } from "../../../../hooks/useDebounce";
import { temas, estado_consulta } from "../../../../types";

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

export default function CourseConsultationsHistory({ courseId }: Props) {
  // --- Estados ---
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<CourseConsultationsHistoryFilters>({
    temas: "",
    estados: "",
    alumnos: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  // Estados UI para filtros múltiples
  const [selectedTemas, setSelectedTemas] = useState<temas[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<estado_consulta[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<
    { id: string; nombre: string }[]
  >([]);

  // Buscador de alumnos
  const [studentOptions, setStudentOptions] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearch, 500);

  // --- Carga de Alumnos ---
  useEffect(() => {
    getStudentProgressList(courseId, {
      page: 1,
      limit: 50,
      sort: "nombre",
      order: "asc",
      search: debouncedStudentSearch,
    }).then((res) => {
      setStudentOptions(
        res.data.map((s) => ({
          id: s.idAlumno,
          nombre: `${s.nombre} ${s.apellido}`,
        })),
      );
    });
  }, [courseId, debouncedStudentSearch]);

  // --- Sincronizar Filtros UI con Filtros API ---
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      temas: selectedTemas.join(","),
      estados: selectedEstados.join(","),
      alumnos: selectedStudents.map((s) => s.id).join(","),
    }));
  }, [selectedTemas, selectedEstados, selectedStudents]);

  // --- Cargar Datos ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseConsultationsHistory(courseId, filters);
        // Parsear fechas para el gráfico
        if (result.timeline) {
          result.timeline = result.timeline.map((t: any) => ({
            ...t,
            fecha: new Date(t.fecha),
          }));
        }
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el historial de consultas.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

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

  const handleEstadosChange = (
    event: SelectChangeEvent<typeof selectedEstados>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedEstados(
      typeof value === "string"
        ? (value.split(",") as estado_consulta[])
        : value,
    );
  };

  const handleClearFilters = () => {
    setFilters({
      temas: "",
      estados: "",
      alumnos: "",
      fechaDesde: "",
      fechaHasta: "",
    });
    setSelectedTemas([]);
    setSelectedEstados([]);
    setSelectedStudents([]);
  };

  // --- Columnas DataGrid ---
  const columns: GridColDef[] = [
    {
      field: "fecha",
      headerName: "Fecha",
      width: 120,
      valueFormatter: (value: string) => format(new Date(value), "dd/MM/yyyy"),
    },
    { field: "titulo", headerName: "Título", flex: 1, minWidth: 150 },
    { field: "tema", headerName: "Tema", width: 130 },
    { field: "alumno", headerName: "Alumno", width: 180 },
    {
      field: "estado",
      headerName: "Estado",
      width: 120,
      renderCell: (params) => {
        const colors: Record<
          string,
          "default" | "primary" | "success" | "warning"
        > = {
          Pendiente: "warning",
          A_revisar: "primary",
          Revisada: "default",
          Resuelta: "success",
        };
        return (
          <Chip
            label={params.value.replace("_", " ")}
            color={colors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
    { field: "docente", headerName: "Atendido por", width: 180 },
    {
      field: "valoracion",
      headerName: "Valoración",
      width: 100,
      valueFormatter: (v) => (v ? `${v} ⭐` : "-"),
    },
  ];

  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        color="primary.main"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Historial de Consultas
      </Typography>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Filtros Rápidos de Tiempo
            </Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button onClick={() => applyQuickFilter(3)}>3 Días</Button>
              <Button onClick={() => applyQuickFilter(7)}>1 Semana</Button>
              <Button onClick={() => applyQuickFilter(30)}>1 Mes</Button>
            </ButtonGroup>
          </Box>

          <Divider />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
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
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
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
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel>Temas</InputLabel>
              <Select
                multiple
                value={selectedTemas}
                onChange={handleTemasChange}
                input={<OutlinedInput label="Temas" />}
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
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel>Estados</InputLabel>
              <Select
                multiple
                value={selectedEstados}
                onChange={handleEstadosChange}
                input={<OutlinedInput label="Estados" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {Object.values(estado_consulta).map((e) => (
                  <MenuItem key={e} value={e}>
                    <Checkbox checked={selectedEstados.indexOf(e) > -1} />
                    <ListItemText primary={e.replace("_", " ")} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              options={studentOptions}
              getOptionLabel={(option) => option.nombre}
              value={selectedStudents}
              onChange={(_, newValue) => setSelectedStudents(newValue)}
              onInputChange={(_, newInputValue) =>
                setStudentSearch(newInputValue)
              }
              filterOptions={(x) => x}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrar por Alumnos"
                  placeholder="Buscar..."
                  size="small"
                />
              )}
              sx={{ width: 300 }}
            />
            <Button variant="text" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>
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
          {/* --- Stats Cards --- */}
          <Grid container spacing={2}>
            <Grid>
              <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Consultas (Periodo)
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {data.stats.total}
                </Typography>
              </Paper>
            </Grid>
            <Grid>
              <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Promedio Diario
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {data.stats.promedioDiario.toFixed(1)}
                </Typography>
              </Paper>
            </Grid>
            <Grid>
              <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Promedio Semanal
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {data.stats.promedioSemanal.toFixed(1)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          {/* --- Timeline Chart --- */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Evolución de Consultas en el Tiempo
            </Typography>
            {data.timeline.length > 0 ? (
              <LineChart
                dataset={data.timeline}
                xAxis={[
                  {
                    scaleType: "point",
                    dataKey: "fecha",
                    valueFormatter: (date) => format(date, "dd/MM"),
                    label: "Fecha",
                  },
                ]}
                series={[
                  {
                    dataKey: "cantidad",
                    label: "Cantidad de Consultas",
                    color: "#1976d2",
                    area: true,
                  },
                ]}
                height={300}
                margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
              />
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No hay datos para mostrar en este periodo.
              </Typography>
            )}
          </Paper>

          {/* --- Tabla Detallada --- */}
          <Paper elevation={3} sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={data.tabla}
              columns={columns}
              density="compact"
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: {
                  sortModel: [{ field: "fecha", sort: "desc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </Paper>
        </Stack>
      )}
    </Paper>
  );
}
