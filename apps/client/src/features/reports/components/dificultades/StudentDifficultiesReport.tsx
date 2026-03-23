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
  IconButton,
  Tooltip,
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
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
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
import { TemasLabels } from "../../../../types/traducciones";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import StudentChartDetailModal from "./StudentChartDetailModal";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";

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

  const totalGrados =
    data?.summary?.graficos?.porGrado?.reduce(
      (acc: number, curr: any) => acc + curr.value,
      0,
    ) || 0;
  const totalTemas =
    data?.summary?.graficos?.porTema?.reduce(
      (acc: number, curr: any) => acc + curr.value,
      0,
    ) || 0;

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
          title="Reporte por Alumno"
          description="Analiza el detalle individual de las dificultades y su evolución para un alumno específico."
          icon={<PersonIcon />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/dificultades/alumno/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/dificultades/alumno/excel`}
          filenameExcel="dificultades_alumno.xlsx"
          disabled={!selectedStudent || !data}
        />

        {/* --- SECCIÓN DE FILTROS UNIFICADA --- */}
        <Stack spacing={2}>
          {/* 1. Selector de Alumno */}
          <Stack direction="row" spacing={0.5} alignItems="center">
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
                  label="Fecha Desde"
                  disableFuture
                  value={
                    filters.fechaDesde
                      ? new Date(filters.fechaDesde + "T00:00:00")
                      : null
                  }
                  maxDate={
                    filters.fechaHasta
                      ? new Date(filters.fechaHasta + "T00:00:00")
                      : undefined
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
                          ...datePickerConfig.slotProps.textField.InputProps.sx,
                          width: 150,
                        },
                      },
                      sx: { width: 150 },
                    },
                  }}
                />
                <DatePicker
                  label="Fecha Hasta"
                  disableFuture
                  value={
                    filters.fechaHasta
                      ? new Date(filters.fechaHasta + "T00:00:00")
                      : null
                  }
                  minDate={
                    filters.fechaDesde
                      ? new Date(filters.fechaDesde + "T00:00:00")
                      : undefined
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
                          ...datePickerConfig.slotProps.textField.InputProps.sx,
                          width: 150,
                        },
                      },
                      sx: { width: 150 },
                    },
                  }}
                />
                <FormControl size="small" sx={{ width: 270 }}>
                  <InputLabel id="temas-label">Filtrar por Temas</InputLabel>
                  <Select
                    labelId="temas-label"
                    multiple
                    value={selectedTemas}
                    onChange={handleTemasChange}
                    input={<OutlinedInput label="Filtrar por Temas" />}
                    renderValue={(selected) =>
                      selected
                        .map((t) => TemasLabels[t as temas] || t)
                        .join(", ")
                    }
                    MenuProps={MenuProps}
                  >
                    {Object.values(temas)
                      .filter((t) => t !== "Ninguno")
                      .map((t) => (
                        <MenuItem key={t} value={t}>
                          <Checkbox checked={selectedTemas.indexOf(t) > -1} />
                          <ListItemText
                            primary={TemasLabels[t as temas] || t}
                          />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 400 }}>
                  <InputLabel id="diff-label">
                    Filtrar por Dificultades
                  </InputLabel>
                  <Select
                    labelId="diff-label"
                    multiple
                    value={selectedDificultadesIds}
                    onChange={handleDificultadesChange}
                    input={<OutlinedInput label="Filtrar por Dificultades" />}
                    renderValue={(selected) => {
                      const names = selected.map(
                        (id) =>
                          availableDifficulties.find((d) => d.id === id)
                            ?.nombre || id,
                      );
                      return names.join(", ");
                    }}
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
                <Tooltip title="Limpiar filtros">
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    color="primary"
                  >
                    <FilterAltOffIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Stack>

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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 3,
              width: "100%",
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
                          highlightScope: { fade: "global", highlight: "item" },
                          valueFormatter: (v: any) => {
                            const val = typeof v === "number" ? v : v?.value;
                            const pct =
                              totalGrados > 0
                                ? ((val / totalGrados) * 100).toFixed(1)
                                : "0.0";
                            return `${val} (${pct}%)`;
                          },
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
                          highlightScope: { fade: "global", highlight: "item" },
                          valueFormatter: (v: any) => {
                            const val = typeof v === "number" ? v : v?.value;
                            const pct =
                              totalTemas > 0
                                ? ((val / totalTemas) * 100).toFixed(1)
                                : "0.0";
                            return `${val} (${pct}%)`;
                          },
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

            {/* --- Gráfico de Evolución --- */}
            <Paper
              elevation={3}
              sx={{ p: 2, width: "100%", boxSizing: "border-box" }}
            >
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

            {/* --- Fuente de Mejora (Barras y Tabla) --- */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Typography variant="h6">Fuente de Mejora</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Proporción de mejoras logradas por cada fuente (reducción de
                grado de dificultad).
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ width: "100%", mt: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      height: 16,
                      borderRadius: 2,
                      overflow: "hidden",
                      mb: 1.5,
                      bgcolor: "grey.300",
                    }}
                  >
                    {data.stats.porcentajeVideojuego > 0 && (
                      <Box
                        sx={{
                          width: `${data.stats.porcentajeVideojuego}%`,
                          bgcolor: "primary.main",
                        }}
                        title={`Videojuego: ${data.stats.porcentajeVideojuego.toFixed(1)}%`}
                      />
                    )}
                    {data.stats.porcentajeSesion > 0 && (
                      <Box
                        sx={{
                          width: `${data.stats.porcentajeSesion}%`,
                          bgcolor: "secondary.main",
                        }}
                        title={`Sesiones: ${data.stats.porcentajeSesion.toFixed(1)}%`}
                      />
                    )}
                  </Box>
                  <Stack
                    direction="row"
                    spacing={3}
                    justifyContent="center"
                    flexWrap="wrap"
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <VideogameAssetIcon
                        color="primary"
                        fontSize="small"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="medium"
                      >
                        Videojuego: {data.stats.porcentajeVideojuego.toFixed(1)}
                        %
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <SchoolIcon
                        color="secondary"
                        fontSize="small"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="medium"
                      >
                        Sesiones: {data.stats.porcentajeSesion.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Typography variant="caption" align="center" sx={{ mt: 2 }}>
                  Total de mejoras registradas:{" "}
                  <strong>{data.stats.totalMejoras}</strong>
                </Typography>

                <Box sx={{ height: 400, width: "100%", mt: 2 }}>
                  <DataGrid
                    rows={data.history}
                    columns={historyColumns}
                    getRowId={(row) => row.id}
                    density="compact"
                    disableRowSelectionOnClick
                    slots={{
                      noRowsOverlay: () => (
                        <Stack
                          height="100%"
                          alignItems="center"
                          justifyContent="center"
                        >
                          No hay historial de cambios para mostrar.
                        </Stack>
                      ),
                    }}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                      sorting: {
                        sortModel: [{ field: "fechaCambio", sort: "desc" }],
                      },
                    }}
                    sx={{
                      "& .MuiDataGrid-cell": {
                        fontSize: "0.75rem",
                      },
                      "& .MuiDataGrid-columnHeader": {
                        fontSize: "0.75rem",
                      },
                      borderRadius: "0.7em",
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
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
    </Box>
  );
}
