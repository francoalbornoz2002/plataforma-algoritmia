import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
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
  Paper,
  CircularProgress,
  Grid,
  IconButton,
} from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
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
    setQueryOptions((prev) => {
      if (prev.search === debouncedSearchTerm) return prev;
      return {
        ...prev,
        search: debouncedSearchTerm,
        page: 1,
      };
    });
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setQueryOptions({
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
        flex: 1,
        valueGetter: (value: any, row: ProgresoAlumnoDetallado) =>
          `${row.nombre} ${row.apellido}`,
      },
      {
        field: "pctMisionesCompletadas",
        headerName: "Progreso (%)",
        width: 100,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `${value.toFixed(1)}%`;
        },
      },
      {
        field: "promEstrellas",
        headerName: "Estrellas (Prom.)",
        width: 125,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return `⭐ ${value.toFixed(1)}`;
        },
      },
      {
        field: "promIntentos",
        headerName: "Intentos (Prom.)",
        width: 125,
        valueFormatter: (value: number) => {
          if (typeof value !== "number") return "N/A";
          return value.toFixed(1);
        },
      },
      {
        field: "totalExp",
        headerName: "EXP Total",
      },
      {
        field: "ultimaActividad",
        headerName: "Última Actividad",
        width: 125,
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

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                {/* --- B. Filtros --- */}
                <Paper elevation={1} sx={{ pt: 1, pb: 2, pr: 2, pl: 2, mb: 1 }}>
                  <Typography variant="overline" sx={{ fontSize: "14px" }}>
                    Filtros
                  </Typography>
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
                </Paper>
                {/* --- C. DataGrid --- */}
                {gridError && <Alert severity="error">{gridError}</Alert>}
                <Box sx={{ height: 400, width: "100%" }}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    rowCount={totalRows}
                    loading={gridLoading}
                    // Paginación
                    paginationMode="server"
                    paginationModel={{
                      page: queryOptions.page - 1,
                      pageSize: queryOptions.limit,
                    }}
                    onPaginationModelChange={handlePaginationChange}
                    pageSizeOptions={[5, 10, 25]}
                    sortingMode="server"
                    sortModel={[
                      { field: queryOptions.sort, sort: queryOptions.order },
                    ]}
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
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {/* Gráfico */}
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Gráfico de progreso global
                  </Typography>
                  <Gauge
                    value={overview.pctMisionesCompletadas}
                    cornerRadius="50%"
                    sx={{
                      [`& .${gaugeClasses.valueText}`]: {
                        fontSize: 35,
                        fontWeight: "bold",
                      },
                      [`& .${gaugeClasses.valueArc}`]: {
                        fill: "#4caf50",
                      },
                    }}
                    text={({ value }) => `${value?.toFixed(1)}%`}
                    height={185}
                  />
                </Paper>
              </Grid>
            </Grid>
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
