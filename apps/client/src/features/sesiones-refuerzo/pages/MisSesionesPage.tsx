import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  TextField,
  Pagination,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import HistoryIcon from "@mui/icons-material/History";

// Hooks, Services, Types
import { useCourseContext } from "../../../context/CourseContext";
import { findAllSesiones } from "../service/sesiones-refuerzo.service";
import {
  type SesionRefuerzoResumen,
  type DocenteBasico,
  type DificultadSimple,
  type FindSesionesParams,
  estado_sesion,
  grado_dificultad,
  type PaginatedSesionesResponse,
} from "../../../types";
import { EstadoSesionLabels } from "../../../types/traducciones";

// Components
import MySesionCard from "../components/MySesionCard";
import {
  findActiveDocentes,
  getAllDifficulties,
} from "../../users/services/docentes.service";
import ResultadoSesionModal from "../components/ResultadoSesionModal";
import HeaderPage from "../../../components/HeaderPage";

export default function MisSesionesPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();
  const navigate = useNavigate();

  // --- Data States ---
  const [sesionesData, setSesionesData] =
    useState<PaginatedSesionesResponse | null>(null);

  // --- Filter States ---
  const [docentesList, setDocentesList] = useState<DocenteBasico[]>([]);
  const [dificultadesList, setDificultadesList] = useState<DificultadSimple[]>(
    [],
  );
  const [filters, setFilters] = useState<
    Omit<FindSesionesParams, "page" | "limit" | "sort" | "order">
  >({});
  const [dateFilters, setDateFilters] = useState<{
    fechaDesde: Date | null;
    fechaHasta: Date | null;
  }>({ fechaDesde: null, fechaHasta: null });
  const [pagination, setPagination] = useState({ page: 1, limit: 9 });
  const [sortOption, setSortOption] = useState("recent");

  // --- Loading/Error States ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modal States ---
  const [sesionToView, setSesionToView] =
    useState<SesionRefuerzoResumen | null>(null);

  // --- Data Fetching ---
  const fetchFilterData = useCallback(async (idCurso: string) => {
    try {
      // Cargamos docentes y dificultades para los filtros
      const [docentes, dificultades] = await Promise.all([
        findActiveDocentes(idCurso),
        getAllDifficulties(),
      ]);
      setDocentesList(docentes);
      setDificultadesList(dificultades);
    } catch (err: any) {
      console.error("Error loading filters", err);
    }
  }, []);

  const fetchSesiones = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);
    try {
      let sort = "nroSesion";
      let order: "asc" | "desc" = "desc";

      if (sortOption === "recent") {
        sort = "createdAt";
        order = "desc";
      } else if (sortOption === "old") {
        sort = "createdAt";
        order = "asc";
      } else if (sortOption === "nro_desc") {
        sort = "nroSesion";
        order = "desc";
      } else if (sortOption === "nro_asc") {
        sort = "nroSesion";
        order = "asc";
      }

      const params: FindSesionesParams = {
        ...pagination,
        ...filters,
        sort,
        order,
        fechaDesde: dateFilters.fechaDesde
          ? format(dateFilters.fechaDesde, "yyyy-MM-dd")
          : undefined,
        fechaHasta: dateFilters.fechaHasta
          ? format(dateFilters.fechaHasta, "yyyy-MM-dd")
          : undefined,
        // El backend filtra automáticamente por el ID del alumno logueado
      };
      const data = await findAllSesiones(selectedCourse.id, params);
      setSesionesData(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al cargar mis sesiones de refuerzo.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, pagination, filters, dateFilters, sortOption]);

  useEffect(() => {
    if (selectedCourse) {
      fetchFilterData(selectedCourse.id);
    }
  }, [selectedCourse, fetchFilterData]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  // --- Handlers ---
  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleResolver = (idSesion: string) => {
    if (!selectedCourse) return;
    // Navegación a la página de resolución (Ruta definida en Router.tsx bajo /my)
    navigate(`/my/sessions/${idSesion}/resolver`);
  };

  if (!selectedCourse) {
    return <Alert severity="info">Por favor, selecciona un curso.</Alert>;
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ height: "100%" }}>
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Mis Sesiones en ${selectedCourse.nombre}`}
          description="Revisa y resuelve tus sesiones de refuerzo asignadas para mejorar en los temas que te resultan difíciles."
          icon={<HistoryIcon />}
          color="primary"
        />

        {/* --- SECCIÓN DE FILTROS --- */}
        <Paper elevation={2} sx={{ pt: 1, pb: 2, pr: 2, pl: 2 }}>
          <Typography variant="overline" sx={{ fontSize: "14px" }}>
            Filtros de búsqueda
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField
              sx={{ width: 120 }}
              label="N° Sesión"
              name="nroSesion"
              size="small"
              type="number"
              onChange={handleFilterChange}
            />
            <FormControl sx={{ width: 200 }} size="small">
              <InputLabel>Docente Asignador</InputLabel>
              <Select
                name="idDocente"
                label="Docente Asignador"
                value={filters.idDocente || ""}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {docentesList.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.nombre} {d.apellido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: 250 }} size="small">
              <InputLabel>Dificultad</InputLabel>
              <Select
                name="idDificultad"
                label="Dificultad"
                value={filters.idDificultad || ""}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {dificultadesList.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: 120 }} size="small">
              <InputLabel>Grado</InputLabel>
              <Select
                name="gradoSesion"
                label="Grado"
                value={filters.gradoSesion || ""}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(grado_dificultad)
                  .filter((g) => g !== grado_dificultad.Ninguno)
                  .map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: 150 }} size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                label="Estado"
                value={filters.estado || ""}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(estado_sesion).map((e) => (
                  <MenuItem key={e} value={e}>
                    {EstadoSesionLabels[e]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Desde"
              value={dateFilters.fechaDesde}
              onChange={(newValue) => {
                setDateFilters((prev) => ({ ...prev, fechaDesde: newValue }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
            <DatePicker
              label="Hasta"
              value={dateFilters.fechaHasta}
              onChange={(newValue) => {
                setDateFilters((prev) => ({ ...prev, fechaHasta: newValue }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortOption}
                label="Ordenar por"
                onChange={(e) => setSortOption(e.target.value)}
              >
                <MenuItem value="recent">Más recientes</MenuItem>
                <MenuItem value="old">Más antiguas</MenuItem>
                <MenuItem value="nro_desc">N° Sesión (Mayor a menor)</MenuItem>
                <MenuItem value="nro_asc">N° Sesión (Menor a mayor)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* --- SECCIÓN DE CONTENIDO --- */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {sesionesData && sesionesData.data.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {sesionesData.data.map((sesion) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sesion.id}>
                      <MySesionCard
                        sesion={sesion}
                        onResolver={!isReadOnly ? handleResolver : undefined}
                        onViewDetails={setSesionToView}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Stack spacing={2} sx={{ mt: 3, alignItems: "center" }}>
                  <Pagination
                    count={sesionesData.meta.totalPages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Stack>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No tienes sesiones de refuerzo asignadas con estos filtros.
              </Alert>
            )}
          </Box>
        )}
      </Stack>

      {/* --- Modal de Resultados --- */}
      {sesionToView && (
        <ResultadoSesionModal
          open={!!sesionToView}
          onClose={() => setSesionToView(null)}
          sesionResumen={sesionToView}
        />
      )}
    </Box>
  );
}
