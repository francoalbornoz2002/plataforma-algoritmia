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
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
  LinearProgress,
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
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonIcon from "@mui/icons-material/Person";

import {
  getStudentDifficultiesReport,
  getCourseDifficultiesReport,
  type StudentDifficultiesReportFilters,
} from "../../service/reports.service";
import { getStudentProgressList } from "../../../users/services/docentes.service";
import { useDebounce } from "../../../../hooks/useDebounce";
import {
  temas,
  fuente_cambio_dificultad,
  grado_dificultad,
} from "../../../../types";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import StudentChartDetailModal from "./StudentChartDetailModal";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";
import { datePickerConfig } from "../../../../config/theme.config";

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

  // Estado para el modal de detalle de gráficos
  const [chartModal, setChartModal] = useState<{
    open: boolean;
    filterType: "grado" | "tema";
    filterValue: string;
    title: string;
  }>({
    open: false,
    filterType: "grado",
    filterValue: "",
    title: "",
  });

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
    setFilters((prev) => ({
      ...prev,
      fechaDesde: "",
      fechaHasta: "",
      fuente: "",
    }));
    setSelectedTemas([]);
    setSelectedDificultadesIds([]);
  };

  // --- Handlers de Gráficos ---
  const handleGradoClick = (event: any, itemIdentifier: any) => {
    if (!data) return;
    const item = data.summary.graficos.porGrado[itemIdentifier.dataIndex];
    if (item) {
      setChartModal({
        open: true,
        filterType: "grado",
        filterValue: item.label,
        title: `Dificultades con Grado: ${item.label}`,
      });
    }
  };

  const handleTemaClick = (event: any, itemIdentifier: any) => {
    if (!data) return;
    const item = data.summary.graficos.porTema[itemIdentifier.dataIndex];
    if (item) {
      setChartModal({
        open: true,
        filterType: "tema",
        filterValue: item.label,
        title: `Dificultades del Tema: ${item.label}`,
      });
    }
  };

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
      width: 200,
      valueGetter: (params, row) => row.dificultad?.tema || "-",
    },
    {
      field: "gradoAnterior",
      headerName: "Grado Anterior",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || "Ninguno"}
          size="small"
          variant="outlined"
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
      width: 120,
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
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/dificultades/alumno/pdf`}
            disabled={!selectedStudent || !data}
          />
          <ExcelExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/dificultades/alumno/excel`}
            disabled={!selectedStudent || !data}
            filename="dificultades_alumno.xlsx"
          />
        </Box>
      </Stack>

      <Stack spacing={3}>
        {/* --- SECCIÓN DE FILTROS UNIFICADA --- */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* 1. Selector de Alumno */}
            <Stack direction="row" spacing={2} alignItems="center">
              <PersonIcon color="primary" fontSize="large" />
              <Autocomplete
                options={students}
                size="small"
                getOptionLabel={(option) => option.nombre}
                value={selectedStudent}
                onChange={(_, newValue) => {
                  setSelectedStudent(newValue);
                  // Si cambiamos de alumno, limpiamos la data para forzar el spinner de carga inicial
                  if (newValue?.id !== selectedStudent?.id) {
                    setData(null);
                  }
                }}
                onInputChange={(_, newInputValue) =>
                  setStudentSearch(newInputValue)
                }
                filterOptions={(x) => x}
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

            <Divider />

            {/* 2. Filtros de Historial (Deshabilitados si no hay alumno) */}
            <Box
              sx={{
                opacity: selectedStudent ? 1 : 0.5,
                pointerEvents: selectedStudent ? "auto" : "none",
                transition: "opacity 0.3s",
              }}
            >
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
                    {...datePickerConfig}
                    slotProps={{
                      textField: {
                        ...datePickerConfig.slotProps.textField,
                        InputProps: {
                          sx: {
                            ...datePickerConfig.slotProps.textField.InputProps
                              .sx,
                            width: 150,
                          },
                        },
                        sx: { width: 150 },
                      },
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
                    {...datePickerConfig}
                    slotProps={{
                      textField: {
                        ...datePickerConfig.slotProps.textField,
                        InputProps: {
                          sx: {
                            ...datePickerConfig.slotProps.textField.InputProps
                              .sx,
                            width: 150,
                          },
                        },
                        sx: { width: 150 },
                      },
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
            </Box>
          </Stack>
        </Paper>

        {!selectedStudent && (
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mt: 4 }}
          >
            Selecciona un alumno para ver su reporte detallado.
          </Typography>
        )}

        {/* Loading Inicial (Solo si no hay data previa) */}
        {selectedStudent && loading && !data && (
          <CircularProgress sx={{ mx: "auto", my: 4 }} />
        )}

        {/* Contenido (Se mantiene visible durante recargas de filtros) */}
        {selectedStudent && data && (
          <Stack
            spacing={3}
            sx={{
              position: "relative",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            {loading && (
              <LinearProgress
                sx={{ position: "absolute", top: -12, left: 0, right: 0 }}
              />
            )}
            {/* --- Gráficos Interactivos --- */}
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Haz clic en las secciones de los gráficos para ver el detalle de
                las dificultades correspondientes.
              </Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Cantidad de Dificultades por GRADO
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: data.summary.graficos.porGrado,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                        },
                      ]}
                      width={300}
                      height={200}
                      onItemClick={handleGradoClick}
                    />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Cantidad de Dificultades por TEMA
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: data.summary.graficos.porTema,
                          innerRadius: 30,
                          paddingAngle: 2,
                          cornerRadius: 4,
                        },
                      ]}
                      width={300}
                      height={200}
                      onItemClick={handleTemaClick}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* --- Stats de Mejora --- */}
            <Paper elevation={3} sx={{ p: 2, bgcolor: "primary.50" }}>
              <Typography variant="h6">Fuente de Mejora</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Proporción de mejoras logradas por cada fuente (reducción de
                grado de dificultad).
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
                  slotProps={{
                    legend: {
                      direction: "vertical",
                      position: {
                        vertical: "middle",
                        horizontal: "start",
                      },
                    },
                  }}
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
          </Stack>
        )}

        {selectedStudent && (
          <StudentChartDetailModal
            open={chartModal.open}
            onClose={() => setChartModal((prev) => ({ ...prev, open: false }))}
            idCurso={courseId}
            idAlumno={selectedStudent.id}
            filterType={chartModal.filterType}
            filterValue={chartModal.filterValue}
            title={chartModal.title}
          />
        )}
      </Stack>
    </Paper>
  );
}
