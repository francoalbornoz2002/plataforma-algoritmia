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
  CircularProgress,
  Grid,
  IconButton,
  Pagination,
} from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import {
  getCourseOverview,
  getStudentProgressList,
} from "../../users/services/docentes.service";

// 2. Tipos
import type { ProgresoCurso, ProgresoAlumnoDetallado } from "../../../types";
import {
  ActivityRange,
  AttemptsRange,
  ProgressRange,
  StarsRange,
} from "../../../types/progress-filters";
import StudentProgressDetailModal from "../components/StudentProgressDetailModal";
import HeaderPage from "client/src/components/HeaderPage";
import StatCard from "../../../components/StatCard";
import ProgressItem from "../components/ProgressItem";

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
  const [allRows, setAllRows] = useState<ProgresoAlumnoDetallado[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // Paginación de la lista
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para filtros
  const [filters, setFilters] = useState({
    progressRange: "",
    starsRange: "",
    attemptsRange: "",
    activityRange: "",
    sortOption: "apellido-asc",
  });

  // Estado local para el buscador
  const [searchTerm, setSearchTerm] = useState("");

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

  // Efecto para buscar los datos de la DataGrid (solo al montar o cambiar curso)
  useEffect(() => {
    if (!selectedCourse) return;

    setGridLoading(true);
    setGridError(null);

    getStudentProgressList(selectedCourse.id)
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

      // Filtro de Progreso
      if (filters.progressRange) {
        const pct = row.pctMisionesCompletadas;
        if (filters.progressRange === ProgressRange.ZERO && pct !== 0)
          return false;
        if (
          filters.progressRange === ProgressRange.RANGE_1_25 &&
          (pct < 1 || pct > 25)
        )
          return false;
        if (
          filters.progressRange === ProgressRange.RANGE_26_50 &&
          (pct < 26 || pct > 50)
        )
          return false;
        if (
          filters.progressRange === ProgressRange.RANGE_51_75 &&
          (pct < 51 || pct > 75)
        )
          return false;
        if (
          filters.progressRange === ProgressRange.RANGE_76_99 &&
          (pct < 76 || pct > 99)
        )
          return false;
        if (filters.progressRange === ProgressRange.FULL && pct !== 100)
          return false;
      }

      // Filtro de Estrellas
      if (filters.starsRange) {
        const stars = row.promEstrellas;
        if (filters.starsRange === StarsRange.LOW && stars > 1) return false;
        if (
          filters.starsRange === StarsRange.MEDIUM &&
          (stars <= 1 || stars > 2)
        )
          return false;
        if (filters.starsRange === StarsRange.HIGH && (stars <= 2 || stars > 3))
          return false;
      }

      // Filtro de Intentos
      if (filters.attemptsRange) {
        const att = row.promIntentos;
        if (filters.attemptsRange === AttemptsRange.FAST && att >= 3)
          return false;
        if (
          filters.attemptsRange === AttemptsRange.NORMAL &&
          (att < 3 || att > 6)
        )
          return false;
        if (
          filters.attemptsRange === AttemptsRange.MANY &&
          (att <= 6 || att > 9)
        )
          return false;
        if (filters.attemptsRange === AttemptsRange.TOO_MANY && att <= 9)
          return false;
      }

      // Filtro de Última Actividad
      if (filters.activityRange) {
        const now = new Date();
        const activityDate = row.ultimaActividad
          ? new Date(row.ultimaActividad)
          : new Date(0);
        const diffDays =
          (now.getTime() - activityDate.getTime()) / (1000 * 3600 * 24);

        if (filters.activityRange === ActivityRange.INACTIVE && diffDays <= 7)
          return false;
        if (filters.activityRange === ActivityRange.LAST_24H && diffDays > 1)
          return false;
        if (filters.activityRange === ActivityRange.LAST_3D && diffDays > 3)
          return false;
        if (filters.activityRange === ActivityRange.LAST_5D && diffDays > 5)
          return false;
        if (filters.activityRange === ActivityRange.LAST_7D && diffDays > 7)
          return false;
      }

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
        case "progreso":
          return (
            multiplier * (a.pctMisionesCompletadas - b.pctMisionesCompletadas)
          );
        case "estrellas":
          return multiplier * (a.totalEstrellas - b.totalEstrellas);
        case "intentos":
          return multiplier * (a.totalIntentos - b.totalIntentos);
        case "exp":
          return multiplier * (a.totalExp - b.totalExp);
        case "actividad": {
          const dateA = a.ultimaActividad
            ? new Date(a.ultimaActividad).getTime()
            : 0;
          const dateB = b.ultimaActividad
            ? new Date(b.ultimaActividad).getTime()
            : 0;
          return multiplier * (dateA - dateB);
        }
        default:
          return a.apellido.localeCompare(b.apellido);
      }
    });

    return result;
  }, [allRows, searchTerm, filters]);

  // Efecto para conectar el buscador a los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // --- 4. HANDLERS (para la DataGrid y Filtros) ---

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      progressRange: "",
      starsRange: "",
      attemptsRange: "",
      activityRange: "",
      sortOption: "apellido-asc",
    });
    setPage(1);
  };

  const handleFilterChange = (
    e: SelectChangeEvent<string | number> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1);
  };

  // --- 5. PAGINACIÓN ---
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
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
        minWidth: 0,
      }}
    >
      <Stack spacing={2} sx={{ height: "100%", minWidth: 0 }}>
        <HeaderPage
          title={`Progreso del Curso ${selectedCourse.nombre}`}
          description="Visualiza el rendimiento global del curso y el detalle individual de cada alumno."
          icon={<AssessmentIcon />}
          color="primary"
        />
        {/* --- A. Resumen (KPIs) --- */}
        {overviewError && <Alert severity="error">{overviewError}</Alert>}

        {overviewLoading ? (
          <CircularProgress sx={{ mb: 3 }} />
        ) : overview ? (
          <Stack spacing={2}>
            {/* KPIs */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <StatCard
                  title="Misiones Completadas"
                  value={overview.misionesCompletadas}
                  subValue={`(${overview.pctMisionesCompletadas.toFixed(1)}% progreso total)`}
                  icon={<TaskAltIcon />}
                  color="success"
                  description="Total acumulado por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <StatCard
                  title="Estrellas Totales"
                  value={overview.totalEstrellas}
                  subValue={`(${overview.promEstrellas.toFixed(1)} prom. / alumno)`}
                  icon={<StarIcon />}
                  color="warning"
                  description="Acumuladas por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <StatCard
                  title="Intentos Totales"
                  value={overview.totalIntentos}
                  subValue={`(${overview.promIntentos.toFixed(1)} prom. / alumno)`}
                  icon={<ReplayIcon />}
                  color="primary"
                  description="Acumuladoss por el curso"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <StatCard
                  title="Experiencia Total"
                  value={overview.totalExp}
                  icon={<BoltIcon />}
                  color="secondary"
                  description="Puntos acumulados por el curso"
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
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  name="sortOption"
                  value={filters.sortOption}
                  label="Ordenar por"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="apellido-asc">Apellido (A-Z)</MenuItem>
                  <MenuItem value="apellido-desc">Apellido (Z-A)</MenuItem>
                  <MenuItem value="progreso-desc">Progreso (Desc.)</MenuItem>
                  <MenuItem value="progreso-asc">Progreso (Asc.)</MenuItem>
                  <MenuItem value="estrellas-desc">Estrellas (Desc.)</MenuItem>
                  <MenuItem value="estrellas-asc">Estrellas (Asc.)</MenuItem>
                  <MenuItem value="intentos-desc">Intentos (Desc.)</MenuItem>
                  <MenuItem value="intentos-asc">Intentos (Asc.)</MenuItem>
                  <MenuItem value="exp-desc">Experiencia (Desc.)</MenuItem>
                  <MenuItem value="exp-asc">Experiencia (Asc.)</MenuItem>
                  <MenuItem value="actividad-desc">
                    Última Act. (Recientes)
                  </MenuItem>
                  <MenuItem value="actividad-asc">
                    Última Act. (Antiguas)
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

            {/* --- C. Lista de Alumnos --- */}
            {gridError && <Alert severity="error">{gridError}</Alert>}

            <Stack spacing={2}>
              {paginatedRows.map((row) => (
                <ProgressItem
                  key={row.id}
                  student={{
                    nombre: row.nombre,
                    apellido: row.apellido,
                    fotoPerfilUrl: row.fotoPerfilUrl,
                  }}
                  stats={{
                    cantMisionesCompletadas: row.cantMisionesCompletadas,
                    progresoPct: row.pctMisionesCompletadas,
                    totalEstrellas: row.totalEstrellas,
                    promEstrellas: row.promEstrellas,
                    totalIntentos: row.totalIntentos,
                    promIntentos: row.promIntentos,
                    totalExp: row.totalExp,
                    ultimaActividad: row.ultimaActividad,
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
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    mb: 2,
                  }}
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
