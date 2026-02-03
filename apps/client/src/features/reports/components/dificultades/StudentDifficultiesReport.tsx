import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Autocomplete,
  TextField,
  Chip,
  Button,
  ButtonGroup,
  Checkbox,
  ListItemText,
  OutlinedInput,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonIcon from "@mui/icons-material/Person";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";

import {
  getStudentDifficultiesReport,
  getCourseDifficultiesReport,
  type StudentDifficultiesReportFilters,
} from "../../service/reports.service";
import { getStudentProgressList } from "../../../users/services/docentes.service";
import { useDebounce } from "../../../../hooks/useDebounce";
import { temas, fuente_cambio_dificultad } from "../../../../types";

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

export default function StudentDifficultiesReport({ courseId }: Props) {
  // --- Estados ---
  const [students, setStudents] = useState<{ id: string; nombre: string }[]>(
    [],
  );
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  const [filters, setFilters] = useState<StudentDifficultiesReportFilters>({
    studentId: "",
    fechaDesde: "",
    fechaHasta: "",
    fuente: "",
    temas: "",
    dificultades: "",
  });

  // Filtros UI
  const [selectedTemas, setSelectedTemas] = useState<temas[]>([]);
  const [selectedDificultadesIds, setSelectedDificultadesIds] = useState<
    string[]
  >([]);
  const [availableDifficulties, setAvailableDifficulties] = useState<
    { id: string; nombre: string; tema: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Estado para el buscador de alumnos
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearch, 500);

  // --- Carga Inicial (Dificultades) ---
  useEffect(() => {
    // Cargar dificultades del curso (para filtros)
    getCourseDifficultiesReport(courseId, {}).then((res) => {
      if (res && res.distribucionGrados) {
        setAvailableDifficulties(
          res.distribucionGrados.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            tema: d.tema,
          })),
        );
      }
    });
  }, [courseId]);

  // --- Carga de Alumnos (con búsqueda) ---
  useEffect(() => {
    getStudentProgressList(courseId, {
      page: 1,
      limit: 100,
      sort: "nombre",
      order: "asc",
      search: debouncedStudentSearch,
    }).then((res) => {
      setStudents(
        res.data.map((s) => ({
          id: s.idAlumno,
          nombre: `${s.nombre} ${s.apellido}`,
        })),
      );
    });
  }, [courseId, debouncedStudentSearch]);

  // --- Sincronizar Filtros ---
  useEffect(() => {
    if (selectedStudent) {
      setFilters((prev) => ({
        ...prev,
        studentId: selectedStudent.id,
        temas: selectedTemas.join(","),
        dificultades: selectedDificultadesIds.join(","),
      }));
    }
  }, [selectedStudent, selectedTemas, selectedDificultadesIds]);

  // --- Cargar Reporte ---
  useEffect(() => {
    if (filters.studentId) {
      setLoading(true);
      getStudentDifficultiesReport(courseId, filters)
        .then((res) => {
          // Convertir fechas de string a Date para que el gráfico las interprete correctamente
          if (res.evolution?.dataset) {
            res.evolution.dataset = res.evolution.dataset.map((d: any) => ({
              ...d,
              date: new Date(d.date),
            }));
          }
          setData(res);
        })
        .finally(() => setLoading(false));
    }
  }, [filters, courseId]);

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
    setFilters((prev) => ({
      ...prev,
      fechaDesde: "",
      fechaHasta: "",
      fuente: "",
    }));
    setSelectedTemas([]);
    setSelectedDificultadesIds([]);
  };

  // --- Columnas Tablas ---
  const summaryColumns: GridColDef[] = [
    { field: "nombre", headerName: "Dificultad", flex: 1 },
    { field: "tema", headerName: "Tema", width: 120 },
    {
      field: "grado",
      headerName: "Grado Actual",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "Alto"
              ? "error"
              : params.value === "Medio"
                ? "warning"
                : "success"
          }
        />
      ),
    },
  ];

  const historyColumns: GridColDef[] = [
    {
      field: "fechaCambio",
      headerName: "Fecha",
      width: 180,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "dd/MM/yyyy hh:mm a") : "-",
    },
    {
      field: "dificultad",
      headerName: "Dificultad",
      flex: 1,
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
      headerName: "Cambio",
      width: 200,
      renderCell: (params) => {
        const anterior = params.row.gradoAnterior;
        const nuevo = params.row.gradoNuevo;
        const weights: Record<string, number> = {
          Ninguno: 0,
          Bajo: 1,
          Medio: 2,
          Alto: 3,
        };
        const esMejora = (weights[anterior] || 0) > (weights[nuevo] || 0);

        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">{anterior}</Typography>
            <Typography variant="body2">→</Typography>
            <Chip
              label={nuevo}
              size="small"
              color={
                nuevo === "Alto"
                  ? "error"
                  : nuevo === "Bajo"
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

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
        >
          Reporte por Alumno
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

      <Stack spacing={3}>
        {/* --- Selector de Alumno --- */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <PersonIcon color="primary" fontSize="large" />
            <Autocomplete
              options={students}
              getOptionLabel={(option) => option.nombre}
              value={selectedStudent}
              onChange={(_, newValue) => setSelectedStudent(newValue)}
              onInputChange={(_, newInputValue) =>
                setStudentSearch(newInputValue)
              }
              filterOptions={(x) => x} // Deshabilitamos filtro cliente para usar el del servidor
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Alumno"
                  placeholder="Buscar por nombre..."
                />
              )}
              sx={{ width: 400 }}
            />
          </Stack>
        </Paper>

        {!selectedStudent && (
          <Typography variant="body1" color="text.secondary" align="center">
            Selecciona un alumno para ver su reporte detallado.
          </Typography>
        )}

        {selectedStudent && loading && <CircularProgress sx={{ mx: "auto" }} />}

        {selectedStudent && data && !loading && (
          <>
            {/* --- Mini Resumen --- */}
            <Grid container spacing={3}>
              <Grid size={6}>
                <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Estado Actual de Dificultades
                  </Typography>
                  <Box sx={{ height: 300, width: "100%" }}>
                    <DataGrid
                      rows={data.summary.tabla}
                      columns={summaryColumns}
                      density="compact"
                      hideFooter
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid size={6}>
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
                    Distribución Actual
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <PieChart
                      series={[
                        {
                          data: data.summary.graficos.porGrado,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                        },
                      ]}
                      width={250}
                      height={200}
                    />
                    <PieChart
                      series={[
                        {
                          data: data.summary.graficos.porTema,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                        },
                      ]}
                      width={250}
                      height={200}
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={4}
                    sx={{ mt: 2, width: "100%", justifyContent: "center" }}
                  >
                    <Typography variant="caption" align="center">
                      Por Grado
                    </Typography>
                    <Typography variant="caption" align="center">
                      Por Tema
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Divider />

            {/* --- Filtros Historial --- */}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtros de Historial
                  </Typography>
                  <ButtonGroup variant="outlined" size="small">
                    <Button onClick={() => applyQuickFilter(3)}>3 Días</Button>
                    <Button onClick={() => applyQuickFilter(7)}>
                      1 Semana
                    </Button>
                    <Button onClick={() => applyQuickFilter(30)}>1 Mes</Button>
                  </ButtonGroup>
                </Box>
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
                    slotProps={{
                      textField: { size: "small", sx: { width: 150 } },
                    }}
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
                    slotProps={{
                      textField: { size: "small", sx: { width: 150 } },
                    }}
                  />
                  <FormControl size="small" sx={{ width: 200 }}>
                    <InputLabel id="temas-label">Temas</InputLabel>
                    <Select
                      labelId="temas-label"
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
                  <FormControl size="small" sx={{ width: 250 }}>
                    <InputLabel id="diff-label">Dificultades</InputLabel>
                    <Select
                      labelId="diff-label"
                      multiple
                      value={selectedDificultadesIds}
                      onChange={handleDificultadesChange}
                      input={<OutlinedInput label="Dificultades" />}
                      renderValue={(selected) =>
                        selected.length + " seleccionadas"
                      }
                      MenuProps={MenuProps}
                    >
                      {availableDifficulties.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          <Checkbox
                            checked={selectedDificultadesIds.indexOf(d.id) > -1}
                          />
                          <ListItemText primary={d.nombre} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button onClick={handleClearFilters}>Limpiar</Button>
                </Stack>
              </Stack>
            </Paper>

            {/* --- Stats de Mejora --- */}
            <Paper elevation={3} sx={{ p: 2, bgcolor: "primary.50" }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Fuente de Mejora
              </Typography>
              <Stack direction="row" spacing={4} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={1}>
                      <VideogameAssetIcon color="primary" />
                      <Typography>Videojuego</Typography>
                    </Stack>
                    <Typography fontWeight="bold">
                      {data.stats.porcentajeVideojuego.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      mt: 1,
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
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={1}>
                      <SchoolIcon color="secondary" />
                      <Typography>Sesiones de refuerzo</Typography>
                    </Stack>
                    <Typography fontWeight="bold">
                      {data.stats.porcentajeSesion.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      mt: 1,
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
              </Stack>
            </Paper>

            {/* --- Gráfico de Evolución --- */}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Evolución de Grados por Dificultad
              </Typography>
              {data.evolution.dataset.length > 0 ? (
                <LineChart
                  dataset={data.evolution.dataset}
                  xAxis={[
                    {
                      scaleType: "point",
                      label: "Fecha",
                      data: data.evolution.dataset.map(
                        (_: any, i: number) => i,
                      ),
                      valueFormatter: (index: number) => {
                        const current = data.evolution.dataset[index];
                        const prev = data.evolution.dataset[index - 1];

                        if (!current) return "";

                        const currentDateStr = format(current.date, "dd/MM");
                        const prevDateStr = prev
                          ? format(prev.date, "dd/MM")
                          : null;

                        return currentDateStr === prevDateStr
                          ? ""
                          : currentDateStr;
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      label: "Grado",
                      min: 0,
                      max: 3,
                      valueFormatter: (v: number) =>
                        ["Ninguno", "Bajo", "Medio", "Alto"][v] || "",
                    },
                  ]}
                  series={data.evolution.series.map((s: any) => ({
                    ...s,
                    connectNulls: true, // Conectar puntos para ver la línea continua
                    valueFormatter: (v: number | null) =>
                      v !== null
                        ? ["Ninguno", "Bajo", "Medio", "Alto"][v] || ""
                        : "",
                  }))}
                  height={350}
                  margin={{ left: 70 }}
                />
              ) : (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ py: 4 }}
                >
                  No hay datos suficientes para mostrar la evolución.
                </Typography>
              )}
            </Paper>

            {/* --- Tabla Historial --- */}
            <Paper elevation={3} sx={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={data.history}
                columns={historyColumns}
                getRowId={(row) => row.id}
                density="compact"
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
              />
            </Paper>
          </>
        )}
      </Stack>
    </Paper>
  );
}
