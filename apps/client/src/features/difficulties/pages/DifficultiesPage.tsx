import { useState, useEffect, useMemo, type ReactNode } from "react";
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
  Tooltip,
  type SelectChangeEvent,
  Button,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getCourseDifficultiesOverview,
  getStudentDifficultyList,
} from "../../users/services/docentes.service";

// 2. Tipos
import type {
  DificultadesCurso,
  FindStudentDifficultiesParams,
  AlumnoDificultadResumen,
} from "../../../types";
import { temas, grado_dificultad } from "../../../types";

// 3. Importamos el Modal
import StudentDifficultyDetailModal from "../components/StudentDifficultyDetailModal";
import GradeChip from "../../../components/GradeChip";
import TemaChip from "../../../components/TemaChip";

// Componente Helper de KPI (copiado de ProgressPage)
interface KpiCardProps {
  title: string;
  value: ReactNode;
  loading: boolean;
}
function KpiCard({ title, value, loading }: KpiCardProps) {
  return (
    <Card>
      {/* Añadimos minHeight para que todas las cards tengan la misma altura */}
      <CardContent sx={{ textAlign: "center", minHeight: 90 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {/* Añadimos un Box para centrar verticalmente el contenido
          y manejar el spinner de carga de forma limpia.
        */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 40, // Altura mínima para el contenido
            mt: 0.5,
          }}
        >
          {loading ? (
            <CircularProgress size={30} />
          ) : // Si el valor es texto/número, lo envolvemos en Typography
          typeof value === "string" || typeof value === "number" ? (
            <Typography variant="h5" component="div">
              {value}
            </Typography>
          ) : (
            // Si no, renderizamos el componente (nuestro Chip)
            value
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Tipo para la fila de la DataGrid
type StudentRow = AlumnoDificultadResumen;

export default function DifficultiesPage() {
  const { selectedCourse } = useCourseContext();

  // Estado para el Resumen (KPIs)
  const [overview, setOverview] = useState<DificultadesCurso | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Estado para la DataGrid
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // --- ¡NUEVO ESTADO PARA EL MODAL! ---
  const [viewingStudent, setViewingStudent] = useState<StudentRow | null>(null);

  // Estado unificado para los filtros de la API
  const [queryOptions, setQueryOptions] =
    useState<FindStudentDifficultiesParams>({
      page: 1,
      limit: 10,
      sort: "apellido", // Ordenar por apellido por defecto
      order: "asc",
      search: "",
      tema: "",
      dificultadId: "", // (Lo dejamos listo para el futuro)
      grado: "",
    });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Lista de dificultades (para el filtro) - (podríamos hacer un fetch, por ahora manual)
  const [allDifficulties, setAllDifficulties] = useState<
    { id: string; nombre: string }[]
  >([]);

  // --- DATA FETCHING (KPIs) ---
  useEffect(() => {
    if (!selectedCourse) return;

    setOverviewLoading(true);
    setOverviewError(null);
    getCourseDifficultiesOverview(selectedCourse.id)
      .then((data) => setOverview(data))
      .catch((err) => setOverviewError(err.message))
      .finally(() => setOverviewLoading(false));

    // (Aquí podrías hacer un fetch para poblar el filtro 'dificultadId')
  }, [selectedCourse]);

  // --- DATA FETCHING (DataGrid) ---
  useEffect(() => {
    if (!selectedCourse) return;

    setGridLoading(true);
    setGridError(null);
    getStudentDifficultyList(selectedCourse.id, queryOptions)
      .then((response) => {
        setRows(response.data);
        setTotalRows(response.total);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [selectedCourse, queryOptions]);

  // Efecto para el buscador (debounce)
  useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      search: debouncedSearchTerm,
      page: 1,
    }));
  }, [debouncedSearchTerm]);

  // --- Handlers (para la DataGrid y Filtros) ---
  const handlePaginationChange = (model: GridPaginationModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize,
    }));
  };

  const handleSortChange = (model: GridSortModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      sort: model[0]?.field || "apellido",
      order: model[0]?.sort || "asc",
    }));
  };

  const handleFilterChange = (
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>
  ) => {
    setQueryOptions((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  // --- COLUMNAS (DataGrid) ---
  const columns = useMemo<GridColDef<StudentRow>[]>(
    () => [
      {
        field: "apellido",
        headerName: "Alumno",
        flex: 2,
        valueGetter: (value: any, row: StudentRow) =>
          `${row.nombre} ${row.apellido}`,
      },
      {
        field: "totalDificultades",
        headerName: "Total Dificultades",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "gradoAlto",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Alto} />
        ),
        flex: 1,
        align: "left",
        headerAlign: "left",
        minWidth: 80,
      },
      {
        field: "gradoMedio",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Medio} />
        ),
        flex: 1,
        align: "left",
        headerAlign: "left",
        minWidth: 80,
      },
      {
        field: "gradoBajo",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Bajo} />
        ),
        flex: 1,
        align: "left",
        headerAlign: "left",
        minWidth: 80,
      },
      {
        field: "actions",
        headerName: "Acciones",
        flex: 1,
        align: "center",
        headerAlign: "left",
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Ver detalle de dificultades">
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
    []
  );

  if (!selectedCourse) {
    return <Alert severity="info">Selecciona un curso para continuar.</Alert>;
  }

  return (
    <Box>
      {/* --- A. Resumen (KPIs) --- */}
      <Typography variant="h4" gutterBottom>
        Resumen de Dificultades
      </Typography>
      {overviewError && <Alert severity="error">{overviewError}</Alert>}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Dificultad más frecuente"
            value={overview?.dificultadModa?.nombre || "N/A"}
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {/* --- 3. Pasamos el TemaChip como 'value' --- */}
          <KpiCard
            title="Tema (Moda)"
            value={
              overview?.temaModa && overview.temaModa !== temas.Ninguno ? (
                <TemaChip tema={overview.temaModa} />
              ) : (
                "N/A" // Fallback si el tema es 'Ninguno'
              )
            }
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {/* --- 4. Pasamos el GradeChip como 'value' --- */}
          <KpiCard
            title="Grado (Promedio)"
            value={
              overview?.promGrado ? (
                <GradeChip grado={overview.promGrado} />
              ) : (
                "N/A"
              )
            }
            loading={overviewLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Dificultades (Prom./Alu.)"
            value={overview ? overview.promDificultades.toFixed(1) : 0}
            loading={overviewLoading}
          />
        </Grid>
      </Grid>

      {/* --- B. Filtros --- */}
      <Typography variant="h4" gutterBottom>
        Dificultades por Alumno
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
              <InputLabel>Tema</InputLabel>
              <Select
                name="tema"
                value={queryOptions.tema}
                label="Tema"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(temas)
                  .filter((t) => t !== "Ninguno")
                  .map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Grado</InputLabel>
              <Select
                name="grado"
                value={queryOptions.grado}
                label="Grado"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(grado_dificultad)
                  .filter((g) => g !== "Ninguno")
                  .map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
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
          paginationMode="server"
          paginationModel={{
            page: queryOptions.page - 1,
            pageSize: queryOptions.limit,
          }}
          onPaginationModelChange={handlePaginationChange}
          pageSizeOptions={[5, 10, 25]}
          sortingMode="server"
          sortModel={[{ field: queryOptions.sort, sort: queryOptions.order }]}
          onSortModelChange={handleSortChange}
        />
      </Box>

      {/* --- D. El Modal de Detalle --- */}
      {viewingStudent && (
        <StudentDifficultyDetailModal
          open={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          idCurso={selectedCourse.id}
          idAlumno={viewingStudent.id}
          nombreAlumno={`${viewingStudent.nombre} ${viewingStudent.apellido}`}
        />
      )}
    </Box>
  );
}
