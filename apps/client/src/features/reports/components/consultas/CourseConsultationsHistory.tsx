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
  Chip,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import FunctionsIcon from "@mui/icons-material/Functions";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";

import {
  getCourseConsultationsHistory,
  type CourseConsultationsHistoryFilters,
} from "../../service/reports.service";
import { getStudentProgressList } from "../../../users/services/docentes.service";
import { useDebounce } from "../../../../hooks/useDebounce";
import { temas, estado_consulta } from "../../../../types";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportStatCard from "../common/ReportStatCard";

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
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          color="primary.main"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          Historial de Consultas
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
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
      </Stack>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />
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

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={4}>
          {/* --- Stats Cards --- */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ReportStatCard
                icon={<FunctionsIcon fontSize="small" />}
                title="Total de Consultas"
                subtitle="Cantidad de consultas realizadas en el periodo indicado"
                count={data.stats.total}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ReportStatCard
                icon={<CalendarTodayIcon fontSize="small" />}
                title="Promedio Diario"
                subtitle="Consultas realizada por día en el periodo indicado"
                count={Number(data.stats.promedioDiario.toFixed(1))}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ReportStatCard
                icon={<DateRangeIcon fontSize="small" />}
                title="Promedio Semanal"
                subtitle="Consultas realizada por semana en el periodo indicado"
                count={Number(data.stats.promedioSemanal.toFixed(1))}
                color="success"
              />
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
                yAxis={[
                  {
                    label: "Consultas realizadas",
                    min: 0,
                    valueFormatter: (value: number) =>
                      Number.isInteger(value) ? value.toString() : "",
                  },
                ]}
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
                  },
                ]}
                height={300}
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
