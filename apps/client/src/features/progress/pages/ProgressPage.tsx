import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Tooltip,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
} from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";

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
  AttemptsRange,
  ProgressRange,
  StarsRange,
} from "../../../types/progress-filters";
import StudentProgressDetailModal from "../components/StudentProgressDetailModal";
import DashboardStatCard from "../../dashboards/components/DashboardStatCard";
import HeaderPage from "client/src/components/HeaderPage";

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

  // Estado para paginación
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Estado para ordenamiento
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "apellido", sort: "asc" },
  ]);

  // Estado para filtros
  const [filters, setFilters] = useState({
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

    const params: FindStudentProgressParams = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      sort: sortModel[0]?.field || "apellido",
      order: (sortModel[0]?.sort as "asc" | "desc") || "asc",
      search: debouncedSearchTerm,
      progressRange: filters.progressRange as ProgressRange | "",
      starsRange: filters.starsRange as StarsRange | "",
      attemptsRange: filters.attemptsRange as AttemptsRange | "",
      activityRange: filters.activityRange as ActivityRange | "",
    };

    getStudentProgressList(selectedCourse.id, params)
      .then((response) => {
        setRows(response.data);
        setTotalRows(response.total);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [
    selectedCourse,
    paginationModel,
    sortModel,
    filters,
    debouncedSearchTerm,
  ]);

  // Efecto para conectar el buscador con (debounce) a los filtros
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchTerm]);

  // --- 4. HANDLERS (para la DataGrid y Filtros) ---

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      progressRange: "",
      starsRange: "",
      attemptsRange: "",
      activityRange: "",
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (
    e: SelectChangeEvent<string | number> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // --- 5. COLUMNAS (DataGrid) ---
  const columns = useMemo<GridColDef<ProgresoAlumnoDetallado>[]>(
    () => [
      {
        field: "apellido",
        headerName: "Alumno",
        flex: 1,
        valueGetter: (value: any, row: ProgresoAlumnoDetallado) =>
          `${row.apellido}, ${row.nombre}`,
      },
      {
        field: "pctMisionesCompletadas",
        headerName: "Progreso (%)",
        align: "center",
        headerAlign: "center",
        width: 100,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `${value.toFixed(1)}%`;
        },
      },
      {
        field: "promEstrellas",
        headerName: "Estrellas (Prom.)",
        align: "center",
        headerAlign: "center",
        width: 125,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `⭐ ${value.toFixed(1)}`;
        },
      },
      {
        field: "promIntentos",
        headerName: "Intentos (Prom.)",
        align: "center",
        headerAlign: "center",
        width: 125,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return value.toFixed(1);
        },
      },
      {
        field: "totalExp",
        headerName: "EXP Total",
        align: "center",
        headerAlign: "center",
      },
      {
        field: "ultimaActividad",
        headerName: "Última Actividad",
        width: 200,
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
        align: "center",
        headerAlign: "center",
        sortable: false,
        width: 95,
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

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <HeaderPage
          title={`Progreso del Curso: ${selectedCourse.nombre}`}
          description="Visualiza el rendimiento global del curso y el detalle individual de cada alumno."
          icon={<AssessmentIcon />}
          color="primary"
          sx={{ mb: 4 }}
        />
        {/* --- A. Resumen (KPIs) --- */}
        {overviewError && <Alert severity="error">{overviewError}</Alert>}

        {overviewLoading ? (
          <CircularProgress sx={{ mb: 3 }} />
        ) : overview ? (
          <Stack spacing={2}>
            {/* KPIs */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Misiones Completadas"
                  value={overview.misionesCompletadas}
                  icon={<TaskAltIcon />}
                  color="success"
                  subtitle="Total acumulado por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Estrellas"
                  value={overview.totalEstrellas}
                  icon={<StarIcon />}
                  color="warning"
                  subtitle="Total acumulado por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Intentos"
                  value={overview.totalIntentos}
                  icon={<ReplayIcon />}
                  color="info"
                  subtitle="Total acumulado por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Experiencia"
                  value={overview.totalExp}
                  icon={<BoltIcon />}
                  color="primary"
                  subtitle="Total acumulado por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Promedio Estrellas"
                  value={overview.promEstrellas.toFixed(1)}
                  icon={<StarIcon />}
                  color="warning"
                  subtitle="Por alumno"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <DashboardStatCard
                  title="Promedio Intentos"
                  value={overview.promIntentos.toFixed(1)}
                  icon={<ReplayIcon />}
                  color="info"
                  subtitle="Por alumno"
                />
              </Grid>
            </Grid>

            {/* --- B. Filtros --- */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                  value={filters.progressRange}
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
                  value={filters.starsRange}
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
                  value={filters.activityRange}
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
            {/* --- C. DataGrid --- */}
            {gridError && <Alert severity="error">{gridError}</Alert>}
            <Paper elevation={2} sx={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                rowCount={totalRows}
                loading={gridLoading}
                // Paginación
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25]}
                sortingMode="server"
                sortModel={sortModel}
                onSortModelChange={setSortModel}
                disableRowSelectionOnClick
                disableColumnResize={true}
                sx={{
                  borderRadius: "0.7em",
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
            </Paper>
          </Stack>
        ) : null}

        {/* --- D. RENDERIZADO DEL MODAL DE DETALLE --- */}
        {viewingStudent && (
          <StudentProgressDetailModal
            open={!!viewingStudent}
            onClose={() => setViewingStudent(null)}
            studentData={viewingStudent}
          />
        )}
      </Stack>
    </Box>
  );
}
