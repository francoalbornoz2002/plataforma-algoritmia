import { useState, useEffect, useMemo } from "react";
import {
  Box,
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
  Autocomplete,
  type SelectChangeEvent,
  Button,
  IconButton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
} from "@mui/x-data-grid";
import TopicIcon from "@mui/icons-material/Topic";
import SpeedIcon from "@mui/icons-material/Speed";
import GroupIcon from "@mui/icons-material/Group";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import {
  getAllDifficulties,
  getCourseDifficultiesOverview,
  getStudentDifficultyList,
} from "../../users/services/docentes.service";

// 2. Tipos
import type {
  DificultadesCurso,
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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const PopperProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

export default function DifficultiesPage() {
  const { selectedCourse } = useCourseContext();

  // Estado para el Resumen (KPIs)
  const [overview, setOverview] = useState<DificultadesCurso | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Estado para la DataGrid (ahora manejado localmente)
  const [allRows, setAllRows] = useState<StudentRow[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // --- ¡NUEVO ESTADO PARA EL MODAL! ---
  const [viewingStudent, setViewingStudent] = useState<StudentRow | null>(null);

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
    tema: "",
    dificultadId: "", // (Lo dejamos listo para el futuro)
    grado: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

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
    if (filters.tema) {
      return allDifficulties.filter((d) => d.tema === filters.tema);
    }
    return allDifficulties;
  }, [allDifficulties, filters.tema]);

  // --- DATA FETCHING (DataGrid) ---
  // Ahora solo se ejecuta al cargar la página o cambiar el curso
  useEffect(() => {
    if (!selectedCourse) return;

    setGridLoading(true);
    setGridError(null);

    getStudentDifficultyList(selectedCourse.id)
      .then((data) => {
        setAllRows(data);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [selectedCourse]);

  // --- FILTRADO LOCAL ---
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Filtro por Búsqueda (Texto)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !row.nombre.toLowerCase().includes(term) &&
          !row.apellido.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      // Filtros por Atributos (Tema, Dificultad, Grado)
      // El alumno debe tener AL MENOS UNA dificultad que coincida con el filtro seleccionado
      if (
        filters.tema &&
        !row.dificultadesDetalle?.some((d) => d.tema === filters.tema)
      )
        return false;
      if (
        filters.dificultadId &&
        !row.dificultadesDetalle?.some(
          (d) => d.idDificultad === filters.dificultadId,
        )
      )
        return false;
      if (
        filters.grado &&
        !row.dificultadesDetalle?.some((d) => d.grado === filters.grado)
      )
        return false;

      return true;
    });
  }, [allRows, searchTerm, filters]);

  // Efecto para el buscador
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [searchTerm]);

  // --- Handlers (para la DataGrid y Filtros) ---
  const handleFilterChange = (
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [name]: value,
      };
      // Si cambia el tema, reseteamos la dificultad seleccionada
      if (name === "tema") {
        newFilters.dificultadId = "";
      }
      return newFilters;
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      tema: "",
      dificultadId: "",
      grado: "",
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // --- COLUMNAS (DataGrid) ---
  const columns = useMemo<GridColDef<StudentRow>[]>(
    () => [
      {
        field: "apellido",
        headerName: "Alumno",
        flex: 2,
        valueGetter: (value: any, row: StudentRow) =>
          `${row.apellido}, ${row.nombre}`,
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
        minWidth: 0,
      }}
    >
      <Stack spacing={2} sx={{ height: "100%", minWidth: 0 }}>
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
          <Autocomplete
            size="small"
            options={Object.values(temas).filter((t) => t !== "Ninguno")}
            getOptionLabel={(option) => TemasLabels[option as temas] || option}
            isOptionEqualToValue={(option, value) => option === value}
            value={
              filters.tema
                ? Object.values(temas)
                    .filter((t) => t !== "Ninguno")
                    .find((t) => t === filters.tema) || null
                : null
            }
            onChange={(_, newValue) =>
              handleFilterChange({
                target: { name: "tema", value: newValue || "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tema"
                placeholder="Filtrar por tema..."
              />
            )}
            sx={{ width: 270 }}
            slotProps={{ popper: PopperProps }}
          />
          <Autocomplete
            size="small"
            options={filteredDifficulties}
            getOptionLabel={(option) => option.nombre || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              filters.dificultadId
                ? filteredDifficulties.find(
                    (d) => d.id === filters.dificultadId,
                  ) || null
                : null
            }
            onChange={(_, newValue) =>
              handleFilterChange({
                target: { name: "dificultadId", value: newValue?.id || "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dificultad"
                placeholder="Filtrar por dificultad..."
              />
            )}
            disabled={allDifficulties.length === 0}
            sx={{ width: 400 }}
            slotProps={{ popper: PopperProps }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Grado</InputLabel>
            <Select
              name="grado"
              value={filters.grado}
              label="Grado"
              onChange={(e) =>
                handleFilterChange(e as SelectChangeEvent<string>)
              }
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }} // Controla la altura del menú del Select
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
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          <Paper
            elevation={2}
            sx={{ height: 600, width: "100%", boxSizing: "border-box" }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={gridLoading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25]}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
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
                border: 0,
              }}
            />
          </Paper>
        </Box>
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
