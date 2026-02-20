import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  type SelectChangeEvent,
  Button,
  IconButton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CategoryIcon from "@mui/icons-material/Category";
import TopicIcon from "@mui/icons-material/Topic";
import SpeedIcon from "@mui/icons-material/Speed";
import GroupIcon from "@mui/icons-material/Group";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getAllDifficulties,
  getCourseDifficultiesOverview,
  getStudentDifficultyList,
} from "../../users/services/docentes.service";

// 2. Tipos
import type {
  DificultadesCurso,
  FindStudentDifficultiesParams,
  AlumnoDificultadResumen,
  DificultadConTema,
} from "../../../types";
import { temas, grado_dificultad } from "../../../types";

// 3. Importamos el Modal
import StudentDifficultyDetailModal from "../components/StudentDifficultyDetailModal";
import GradeChip from "../../../components/GradeChip";
import { TemasLabels } from "../../../types/traducciones";
import HeaderPage from "../../../components/HeaderPage";
import DashboardStatCard from "../../dashboards/components/DashboardStatCard";
import DashboardTextCard from "../../dashboards/components/DashboardTextCard";
import { Warning } from "@mui/icons-material";

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

  const [allDifficulties, setAllDifficulties] = useState<DificultadConTema[]>(
    [],
  );

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

  // Para poblar el filtro de dificultades
  useEffect(() => {
    getAllDifficulties()
      .then((data) => {
        setAllDifficulties(data);
      })
      .catch((err) => {
        console.error("Error al cargar lista de dificultades:", err);
      });
  }, []); // Array vacío, se ejecuta solo al montar

  // Filtramos las dificultades disponibles según el tema seleccionado
  const filteredDifficulties = useMemo(() => {
    if (queryOptions.tema) {
      return allDifficulties.filter((d) => d.tema === queryOptions.tema);
    }
    return allDifficulties;
  }, [allDifficulties, queryOptions.tema]);

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
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    setQueryOptions((prev) => {
      const newOptions = {
        ...prev,
        [name]: value,
        page: 1,
      };
      // Si cambia el tema, reseteamos la dificultad seleccionada
      if (name === "tema") {
        newOptions.dificultadId = "";
      }
      return newOptions;
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setQueryOptions({
      page: 1,
      limit: 10,
      sort: "apellido",
      order: "asc",
      search: "",
      tema: "",
      dificultadId: "",
      grado: "",
    });
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
        align: "center",
        headerAlign: "center",
      },
      {
        field: "gradoAlto",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Alto} />
        ),
        flex: 1,
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
      {
        field: "gradoMedio",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Medio} />
        ),
        flex: 1,
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
      {
        field: "gradoBajo",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Bajo} />
        ),
        flex: 1,
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
      {
        field: "gradoNinguno",
        renderHeader: () => (
          <GradeChip texto="Grado" grado={grado_dificultad.Ninguno} />
        ),
        flex: 1,
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
      {
        field: "actions",
        headerName: "Detalle",
        flex: 1,
        align: "center",
        headerAlign: "center",
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
    [],
  );

  if (!selectedCourse) {
    return <Alert severity="info">Selecciona un curso para continuar.</Alert>;
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
          title={`Dificultades del Curso: ${selectedCourse.nombre}`}
          description="Identifica los temas más complejos y visualiza el estado de dificultades de tus alumnos."
          icon={<Warning />}
          color="primary"
          sx={{ mb: 3 }}
        />

        {/* --- A. Resumen (KPIs) --- */}
        {overviewError && <Alert severity="error">{overviewError}</Alert>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <DashboardStatCard
                title="Promedio por Alumno"
                value={overview ? overview.promDificultades.toFixed(1) : 0}
                subtitle="Dificultades activas / alumno"
                icon={<GroupIcon />}
                color="primary"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4.6 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <DashboardTextCard
                title="Dificultad más frecuente"
                description="Dificultad que afecta a más alumnos"
                value={overview?.dificultadModa?.nombre || "N/A"}
                icon={<Warning />}
                color="error"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <DashboardTextCard
                title="Tema de dificultad más frecuente"
                description="Tema que afecta a más alumnos"
                value={
                  overview?.temaModa && overview.temaModa !== temas.Ninguno
                    ? TemasLabels[overview.temaModa]
                    : "N/A"
                }
                icon={<TopicIcon />}
                color="secondary"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <DashboardStatCard
                title="Grado Promedio"
                subtitle="De las dificultades de los alumnos"
                value={overview?.promGrado || "N/A"}
                icon={<SpeedIcon />}
                color={
                  overview?.promGrado === grado_dificultad.Alto
                    ? "error"
                    : overview?.promGrado === grado_dificultad.Medio
                      ? "warning"
                      : overview?.promGrado === grado_dificultad.Bajo
                        ? "success"
                        : "info"
                }
              />
            )}
          </Grid>
        </Grid>

        {/* --- B. Filtros --- */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            label="Buscar Alumno..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ width: 200 }}>
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
                    {TemasLabels[t]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 300 }}>
            <InputLabel>Dificultad</InputLabel>
            <Select
              name="dificultadId"
              value={queryOptions.dificultadId}
              label="Dificultad"
              onChange={handleFilterChange}
              disabled={allDifficulties.length === 0} // Deshabilitar si aún no carga
            >
              <MenuItem value="">Todas</MenuItem>
              {filteredDifficulties.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre}
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
              borderRadius: "0.7em",
            }}
          />
        </Paper>
      </Stack>

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
