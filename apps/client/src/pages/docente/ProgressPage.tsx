import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
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
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// 1. Hooks y Servicios
import { useCourseContext } from "../../context/CourseContext";
import { useDebounce } from "../../hooks/useDebounce"; // Asumo que tienes este hook
import {
  getCourseOverview,
  getStudentProgressList,
} from "../../services/docentes.service";

// 2. Tipos
import type {
  ProgresoCurso,
  ProgresoAlumnoDetallado,
  FindStudentProgressParams,
} from "../../types";
import {
  ActivityRange,
  ProgressRange,
  StarsRange,
} from "../../types/progress-filters";

// --- Componente Helper para los KPIs ---
interface KpiCardProps {
  title: string;
  value: string | number;
  loading: boolean;
}
function KpiCard({ title, value, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {loading ? <CircularProgress size={30} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );
}
// --- Fin Componente Helper ---

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
    e: SelectChangeEvent<string | number> | React.ChangeEvent<HTMLInputElement>
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
    ],
    []
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
    <Box>
      {/* --- A. Resumen (KPIs) --- */}
      <Typography variant="h4" gutterBottom>
        Resumen de Progreso
      </Typography>
      {overviewError && <Alert severity="error">{overviewError}</Alert>}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Progreso Total"
            value={
              overview ? `${overview.pctMisionesCompletadas.toFixed(1)}%` : 0
            }
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Estrellas (Prom.)"
            value={overview ? `⭐ ${overview.promEstrellas.toFixed(1)}` : 0}
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Intentos (Prom.)"
            value={overview ? overview.promIntentos.toFixed(1) : 0}
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="EXP Total"
            value={overview ? overview.totalExp : 0}
            loading={overviewLoading}
          />
        </Grid>
      </Grid>

      {/* --- B. Filtros --- */}
      <Typography variant="h4" gutterBottom>
        Progreso de Alumnos
      </Typography>
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Filtros</Typography>
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
                <MenuItem value={ActivityRange.LAST_24H}>Últimas 24h</MenuItem>
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
        />
      </Box>
    </Box>
  );
}
