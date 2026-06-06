import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Autocomplete,
  type SelectChangeEvent,
  IconButton,
  Pagination,
} from "@mui/material";
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
import { TemasLabels } from "../../../types/traducciones";
import HeaderPage from "../../../components/HeaderPage";
import { AssignmentLate, Warning } from "@mui/icons-material";
import StatCard from "../../../components/StatCard";
import SchoolIcon from "@mui/icons-material/School";
import DifficultiesItem from "../components/DifficultiesItem";

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

  // Paginación de la lista
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para filtros
  const [filters, setFilters] = useState({
    tema: "",
    dificultadId: "", // (Lo dejamos listo para el futuro)
    grado: "",
    sortOption: "apellido-asc",
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
    let result = allRows.filter((row) => {
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

    // Ordenamiento
    result.sort((a, b) => {
      const sortOpt = filters.sortOption || "apellido-asc";
      const [field, order] = sortOpt.split("-");
      const multiplier = order === "asc" ? 1 : -1;

      switch (field) {
        case "apellido":
          return multiplier * a.apellido.localeCompare(b.apellido);
        case "total":
          return multiplier * (a.totalDificultades - b.totalDificultades);
        case "alto":
          return multiplier * (a.gradoAlto - b.gradoAlto);
        case "medio":
          return multiplier * (a.gradoMedio - b.gradoMedio);
        case "bajo":
          return multiplier * (a.gradoBajo - b.gradoBajo);
        case "ninguno":
          return multiplier * (a.gradoNinguno - b.gradoNinguno);
        default:
          return a.apellido.localeCompare(b.apellido);
      }
    });

    return result;
  }, [allRows, searchTerm, filters]);

  // Efecto para el buscador
  useEffect(() => {
    setPage(1);
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
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      tema: "",
      dificultadId: "",
      grado: "",
      sortOption: "apellido-asc",
    });
    setPage(1);
  };

  // --- PAGINACIÓN ---
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
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
          title={`Dificultades del Curso ${selectedCourse.nombre}`}
          description="Identifica los temas más complejos y visualiza el estado de dificultades de tus alumnos."
          icon={<AssignmentLate />}
          color="error"
        />

        {/* --- A. Resumen (KPIs) --- */}
        {overviewError && <Alert severity="error">{overviewError}</Alert>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <StatCard
                title="Prom. por Alumno"
                value={overview ? overview.promDificultades.toFixed(1) : 0}
                description="Dificultades activas / alumno"
                icon={<GroupIcon />}
                color="primary"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <StatCard
                title="Dificultad Frecuente"
                mode="text"
                description="Que afecta a más alumnos"
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
              <StatCard
                title="Tema Frecuente"
                mode="text"
                description="Tema con más dificultades"
                value={
                  overview?.temaModa && overview.temaModa !== temas.Ninguno
                    ? TemasLabels[overview.temaModa]
                    : "N/A"
                }
                icon={<TopicIcon />}
                color="info"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <StatCard
                title="Grado Promedio"
                mode="text"
                description="De dificultades activas"
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {overviewLoading ? (
              <CircularProgress />
            ) : (
              <StatCard
                title="Alumno Crítico"
                mode="text"
                description="Que más dificultades tiene"
                value={overview?.alumnoCritico || "Ninguno"}
                icon={<SchoolIcon />}
                color="secondary"
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              name="sortOption"
              value={filters.sortOption}
              label="Ordenar por"
              onChange={(e) =>
                handleFilterChange(e as SelectChangeEvent<string>)
              }
            >
              <MenuItem value="apellido-asc">Apellido (A-Z)</MenuItem>
              <MenuItem value="apellido-desc">Apellido (Z-A)</MenuItem>
              <MenuItem value="total-desc">Total (Desc.)</MenuItem>
              <MenuItem value="total-asc">Total (Asc.)</MenuItem>
              <MenuItem value="alto-desc">Grado Alto (Desc.)</MenuItem>
              <MenuItem value="alto-asc">Grado Alto (Asc.)</MenuItem>
              <MenuItem value="medio-desc">Grado Medio (Desc.)</MenuItem>
              <MenuItem value="medio-asc">Grado Medio (Asc.)</MenuItem>
              <MenuItem value="bajo-desc">Grado Bajo (Desc.)</MenuItem>
              <MenuItem value="bajo-asc">Grado Bajo (Asc.)</MenuItem>
              <MenuItem value="ninguno-desc">Superadas (Desc.)</MenuItem>
              <MenuItem value="ninguno-asc">Superadas (Asc.)</MenuItem>
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

        {/* --- C. Lista de Alumnos --- */}
        {gridError && <Alert severity="error">{gridError}</Alert>}

        <Stack spacing={2}>
          {paginatedRows.map((row) => (
            <DifficultiesItem
              key={row.id}
              student={{
                nombre: row.nombre,
                apellido: row.apellido,
              }}
              stats={{
                total: row.totalDificultades,
                alto: row.gradoAlto,
                medio: row.gradoMedio,
                bajo: row.gradoBajo,
                ninguno: row.gradoNinguno,
              }}
              onDetailClick={() => setViewingStudent(row)}
            />
          ))}

          {filteredRows.length === 0 && !gridLoading && (
            <Alert severity="info">
              No se encontraron alumnos con los filtros aplicados.
            </Alert>
          )}

          {totalPages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
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
