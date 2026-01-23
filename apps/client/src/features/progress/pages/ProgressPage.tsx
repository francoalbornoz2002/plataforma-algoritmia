import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Tooltip,
  Button,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { PieChart } from "@mui/x-charts/PieChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import PercentIcon from "@mui/icons-material/Percent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce"; // Asumo que tienes este hook
import {
  getCourseOverview,
  getStudentProgressList,
} from "../../users/services/docentes.service";

// 2. Tipos
import type {
  ProgresoCurso,
  ProgresoAlumnoDetallado,
  FindStudentProgressParams,
} from "../../../types";
import {
  ActivityRange,
  ProgressRange,
  StarsRange,
} from "../../../types/progress-filters";
import StudentProgressDetailModal from "../components/StudentProgressDetailModal";

type StudentRow = ProgresoAlumnoDetallado;

export default function ProgressPage() {
  // --- 1. CONTEXTO ---
  const { selectedCourse } = useCourseContext();

  // --- 2. ESTADOS ---

  // Estado para el Resumen (KPIs)
  const [overview, setOverview] = useState<ProgresoCurso | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Estado para la DataGrid
  const [rows, setRows] = useState<ProgresoAlumnoDetallado[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // Estado unificado para todos los filtros de la API
  const [queryOptions, setQueryOptions] = useState<FindStudentProgressParams>({
    page: 1,
    limit: 10,
    sort: "nombre",
    order: "asc",
    search: "",
    progressRange: "",
    starsRange: "",
    attemptsRange: "",
    activityRange: "",
  });

  // Estado local para el buscador (para debouncing)
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Estado para el modal del detalle de las misiones del alumno
  const [viewingStudent, setViewingStudent] = useState<StudentRow | null>(null);

  // --- 3. DATA FETCHING (EFFECTS) ---

  // Efecto para buscar el Resumen (KPIs)
  useEffect(() => {
    if (!selectedCourse) return;

    setOverviewLoading(true);
    setOverviewError(null);
    getCourseOverview(selectedCourse.id)
      .then((data) => setOverview(data))
      .catch((err) => setOverviewError(err.message))
      .finally(() => setOverviewLoading(false));
  }, [selectedCourse]);

  // Efecto para buscar los datos de la DataGrid (se activa con CUALQUIER filtro)
  useEffect(() => {
    if (!selectedCourse) return;

    setGridLoading(true);
    setGridError(null);
    getStudentProgressList(selectedCourse.id, queryOptions)
      .then((response) => {
        setRows(response.data);
        setTotalRows(response.total);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [selectedCourse, queryOptions]); // <-- Se re-ejecuta si el curso o los filtros cambian

  // Efecto para conectar el buscador con (debounce) a los filtros
  useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      search: debouncedSearchTerm,
      page: 1, // Resetea a la pág 1 al buscar
    }));
  }, [debouncedSearchTerm]);

  // --- 4. HANDLERS (para la DataGrid y Filtros) ---

  const handlePaginationChange = (model: GridPaginationModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      page: model.page + 1, // El DTO espera 1-indexed, MUI usa 0-indexed
      limit: model.pageSize,
    }));
  };

  const handleSortChange = (model: GridSortModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      sort: model[0]?.field || "nombre",
      order: model[0]?.sort || "asc",
    }));
  };

  const handleFilterChange = (
    e: SelectChangeEvent<string | number> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQueryOptions((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1, // Resetea a la pág 1 al filtrar
    }));
  };

  // --- 5. COLUMNAS (DataGrid) ---
  const columns = useMemo<GridColDef<ProgresoAlumnoDetallado>[]>(
    () => [
      {
        field: "nombre",
        headerName: "Alumno",
        flex: 2,
        valueGetter: (value: any, row: ProgresoAlumnoDetallado) =>
          `${row.nombre} ${row.apellido}`,
      },
      {
        field: "pctMisionesCompletadas",
        headerName: "Progreso (%)",
        flex: 1,
        // --- CORRECCIÓN AQUÍ ---
        // La firma es (value).
        // 'value' es el número de pctMisionesCompletadas
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `${value.toFixed(1)}%`;
        },
      },
      {
        field: "promEstrellas",
        headerName: "Estrellas (Prom.)",
        flex: 1,
        // --- CORRECCIÓN AQUÍ ---
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `⭐ ${value.toFixed(1)}`;
        },
      },
      {
        field: "promIntentos",
        headerName: "Intentos (Prom.)",
        flex: 1,
        // --- CORRECCIÓN AQUÍ ---
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return value.toFixed(1);
        },
      },
      {
        field: "totalExp",
        headerName: "EXP Total",
        flex: 1,
      },
      {
        field: "ultimaActividad",
        headerName: "Última Actividad",
        flex: 2,
        // --- CORRECCIÓN AQUÍ ---
        valueFormatter: (value: string | null) => {
          if (!value) return "Nunca";
          return (
            "hace " +
            formatDistanceToNow(new Date(value), {
              locale: es,
              addSuffix: false,
            })
          );
        },
      },
      {
        field: "actions",
        headerName: "Misiones",
        flex: 1,
        align: "center",
        headerAlign: "center",
        sortable: false,
        minWidth: 120,
        renderCell: (params) => (
          <Tooltip title="Ver detalle de misiones">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setViewingStudent(params.row)} // <-- Abre el modal
            >
              Detalle
            </Button>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  // --- 6. RENDERIZADO ---
  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver el progreso.
      </Alert>
    );
  }

  // Datos para el gráfico
  const pieChartData = overview
    ? [
        {
          label: "Completado",
          value: overview.pctMisionesCompletadas,
          color: "#4caf50",
        },
        {
          label: "Restante",
          value: 100 - overview.pctMisionesCompletadas,
          color: "#e0e0e0",
        },
      ]
    : [];

  return (
    <Box>
      {/* --- A. Resumen (KPIs) --- */}
      {overviewError && <Alert severity="error">{overviewError}</Alert>}

      {overviewLoading ? (
        <CircularProgress sx={{ mb: 3 }} />
      ) : overview ? (
        <Paper elevation={5} component="section" sx={{ p: 2, mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
          >
            Resumen de Progreso del Curso
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            {/* KPIs */}
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PercentIcon color="success" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Progreso Promedio del Curso
                      </Typography>
                    </Stack>
                    <Typography
                      variant="h3"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      {overview.pctMisionesCompletadas.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TaskAltIcon color="info" fontSize="small" />
                      <Typography variant="caption" display="block">
                        Misiones Completadas (Total acumulado)
                      </Typography>
                    </Stack>
                    <Typography variant="h6">
                      {overview.misionesCompletadas}
                    </Typography>
                  </Box>
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
                        {overview.totalEstrellas}
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
                        {overview.totalExp}
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
                        {overview.totalIntentos}
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
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <StarIcon color="warning" fontSize="inherit" />
                          <Typography variant="caption">Estrellas</Typography>
                        </Stack>
                        <Typography variant="h6" color="warning.main">
                          {overview.promEstrellas.toFixed(1)}
                        </Typography>
                      </Box>
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <ReplayIcon color="info" fontSize="inherit" />
                          <Typography variant="caption">Intentos</Typography>
                        </Stack>
                        <Typography variant="h6" color="info.main">
                          {overview.promIntentos.toFixed(1)}
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
                      data: pieChartData,
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
        </Paper>
      ) : null}

      {/* --- B. Filtros --- */}
      <Paper elevation={5} component="section" sx={{ p: 2, mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
        >
          Progresos individuales de alumnos
        </Typography>
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Filtros de búsqueda</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Buscar Alumno..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Progreso</InputLabel>
                <Select
                  name="progressRange"
                  value={queryOptions.progressRange}
                  label="Progreso"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(ProgressRange).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}%
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Estrellas</InputLabel>
                <Select
                  name="starsRange"
                  value={queryOptions.starsRange}
                  label="Estrellas"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {Object.entries(StarsRange).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value} ⭐
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Últ. Actividad</InputLabel>
                <Select
                  name="activityRange"
                  value={queryOptions.activityRange}
                  label="Últ. Actividad"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={ActivityRange.LAST_24H}>
                    Últimas 24h
                  </MenuItem>
                  <MenuItem value={ActivityRange.LAST_3D}>
                    Últimos 3 días
                  </MenuItem>
                  <MenuItem value={ActivityRange.LAST_7D}>
                    Últimos 7 días
                  </MenuItem>
                  <MenuItem value={ActivityRange.INACTIVE}>
                    Inactivo (+7d)
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* --- C. DataGrid --- */}
        {gridError && <Alert severity="error">{gridError}</Alert>}
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={totalRows}
            loading={gridLoading}
            // Paginación
            paginationMode="server"
            paginationModel={{
              page: queryOptions.page - 1, // MUI es 0-indexed
              pageSize: queryOptions.limit,
            }}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[5, 10, 25]}
            // Ordenamiento
            sortingMode="server"
            sortModel={[{ field: queryOptions.sort, sort: queryOptions.order }]}
            onSortModelChange={handleSortChange}
            disableRowSelectionOnClick
            disableColumnResize={true}
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus-within": {
                outline: "none",
              },
            }}
          />
        </Box>
        {/* --- D. RENDERIZADO DEL MODAL DE DETALLE --- */}
        {viewingStudent && (
          <StudentProgressDetailModal
            open={!!viewingStudent}
            onClose={() => setViewingStudent(null)}
            studentData={viewingStudent}
          />
        )}
      </Paper>
    </Box>
  );
}
