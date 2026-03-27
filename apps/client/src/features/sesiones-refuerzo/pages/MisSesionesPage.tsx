import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  IconButton,
  Tooltip,
  Autocomplete,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useNavigate } from "react-router";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import AutoAwesome from "@mui/icons-material/AutoAwesome";

// Hooks, Services, Types
import { useCourseContext } from "../../../context/CourseContext";
import { findAllSesiones } from "../service/sesiones-refuerzo.service";
import {
  type SesionRefuerzoResumen,
  type DocenteBasico,
  type DificultadSimple,
  estado_sesion,
  grado_dificultad,
} from "../../../types";
import { EstadoSesionLabels } from "../../../types/traducciones";

// Components
import MySesionCard from "../components/MySesionCard";
import {
  findActiveDocentes,
  getAllDifficulties,
} from "../../users/services/docentes.service";
import SesionDetailModal from "../../reports/components/sesiones-refuerzo/SesionDetailModal";
import HeaderPage from "../../../components/HeaderPage";
import { SwitchAccessShortcutAdd } from "@mui/icons-material";
import { datePickerConfig } from "../../../config/theme.config";

export default function MisSesionesPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();
  const navigate = useNavigate();

  // --- Data States ---
  const [allSesiones, setAllSesiones] = useState<SesionRefuerzoResumen[]>([]);

  // --- Filter States ---
  const [docentesList, setDocentesList] = useState<DocenteBasico[]>([]);
  const [dificultadesList, setDificultadesList] = useState<DificultadSimple[]>(
    [],
  );
  const [filters, setFilters] = useState<{
    idDocente?: string;
    idDificultad?: string;
    gradoSesion?: grado_dificultad | "";
    estado?: estado_sesion | "";
  }>({});
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
      const data = await findAllSesiones(selectedCourse.id);
      setAllSesiones(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al cargar mis sesiones de refuerzo.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      fetchFilterData(selectedCourse.id);
    }
  }, [selectedCourse, fetchFilterData]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  // --- LÓGICA DE FILTRADO, ORDENAMIENTO Y PAGINACIÓN LOCAL ---
  const filteredAndSortedSesiones = useMemo(() => {
    let result = allSesiones.filter((sesion) => {
      // Lógica diferenciada para filtrar por Sistema o por Docente
      if (filters.idDocente) {
        if (filters.idDocente === "SISTEMA" && sesion.idDocente !== null) {
          return false;
        } else if (
          filters.idDocente !== "SISTEMA" &&
          sesion.idDocente !== filters.idDocente
        ) {
          return false;
        }
      }
      if (filters.idDificultad && sesion.idDificultad !== filters.idDificultad)
        return false;
      if (filters.gradoSesion && sesion.gradoSesion !== filters.gradoSesion)
        return false;
      if (filters.estado && sesion.estado !== filters.estado) return false;

      const sessionDate = new Date(sesion.createdAt);
      sessionDate.setHours(0, 0, 0, 0);

      if (dateFilters.fechaDesde) {
        const from = new Date(dateFilters.fechaDesde);
        from.setHours(0, 0, 0, 0);
        if (sessionDate < from) return false;
      }
      if (dateFilters.fechaHasta) {
        const to = new Date(dateFilters.fechaHasta);
        to.setHours(0, 0, 0, 0);
        if (sessionDate > to) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortOption === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortOption === "old") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (sortOption === "nro_desc") {
        return b.nroSesion - a.nroSesion;
      } else if (sortOption === "nro_asc") {
        return a.nroSesion - b.nroSesion;
      }
      return 0;
    });
  }, [allSesiones, filters, dateFilters, sortOption]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedSesiones.length / pagination.limit),
  );
  const currentSesiones = filteredAndSortedSesiones.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  );

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

  const handleClearFilters = () => {
    setFilters({});
    setDateFilters({ fechaDesde: null, fechaHasta: null });
    setSortOption("recent");
    setPagination((prev) => ({ ...prev, page: 1 }));
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
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Stack spacing={2} sx={{ height: "100%", minWidth: 0 }}>
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Mis Sesiones en ${selectedCourse.nombre}`}
          description="Revisa y resuelve tus sesiones de refuerzo asignadas para mejorar en los temas que te resultan difíciles."
          icon={<SwitchAccessShortcutAdd />}
          color="primary"
        />

        {/* --- SECCIÓN DE FILTROS --- */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          rowGap={2}
          alignItems="center"
        >
          <DatePicker
            label="F. Desde (Asig.)"
            disableFuture
            value={dateFilters.fechaDesde}
            maxDate={dateFilters.fechaHasta || undefined}
            onChange={(newValue) => {
              setDateFilters((prev) => ({ ...prev, fechaDesde: newValue }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            {...datePickerConfig}
            sx={{ width: 170 }}
          />
          <DatePicker
            label="F. Hasta (Asig.)"
            disableFuture
            value={dateFilters.fechaHasta}
            minDate={dateFilters.fechaDesde || undefined}
            onChange={(newValue) => {
              setDateFilters((prev) => ({ ...prev, fechaHasta: newValue }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            {...datePickerConfig}
            sx={{ width: 170 }}
          />
          <Autocomplete
            size="small"
            options={[
              { id: "SISTEMA", nombre: "Sistema", apellido: "(Automático)" },
              ...docentesList,
            ]}
            getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
            value={
              filters.idDocente === "SISTEMA"
                ? { id: "SISTEMA", nombre: "Sistema", apellido: "(Automático)" }
                : docentesList.find((d) => d.id === filters.idDocente) || null
            }
            onChange={(_, newValue) => {
              setFilters((prev) => ({
                ...prev,
                idDocente: newValue?.id || undefined,
              }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            renderOption={(props, option) => {
              const { key, ...restProps } = props as any;
              return (
                <Box component="li" key={key} {...restProps}>
                  {option.id === "SISTEMA" ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "secondary.main",
                        fontWeight: "bold",
                      }}
                    >
                      <AutoAwesome sx={{ mr: 1, fontSize: 20 }} />
                      {option.nombre} {option.apellido}
                    </Box>
                  ) : (
                    `${option.nombre} ${option.apellido}`
                  )}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Origen / Asignador"
                placeholder="Buscar..."
              />
            )}
            sx={{ width: 250 }}
          />
          <Autocomplete
            size="small"
            options={dificultadesList}
            getOptionLabel={(option) => option.nombre}
            value={
              dificultadesList.find((d) => d.id === filters.idDificultad) ||
              null
            }
            onChange={(_, newValue) => {
              setFilters((prev) => ({
                ...prev,
                idDificultad: newValue?.id || undefined,
              }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dificultad"
                placeholder="Buscar..."
              />
            )}
            sx={{ minWidth: 350, flex: 1 }}
          />
          <FormControl sx={{ width: 100 }} size="small">
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
          <FormControl sx={{ width: 140 }} size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              label="Estado"
              value={filters.estado || ""}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(estado_sesion)
                .filter((e) => e !== estado_sesion.En_curso)
                .map((e) => (
                  <MenuItem key={e} value={e}>
                    {EstadoSesionLabels[e]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortOption}
              label="Ordenar por"
              onChange={(e) => setSortOption(e.target.value)}
            >
              <MenuItem value="recent">Más recientes</MenuItem>
              <MenuItem value="old">Más antiguas</MenuItem>
              <MenuItem value="nro_asc">N° Sesión (Asc.)</MenuItem>
              <MenuItem value="nro_desc">N° Sesión (Des.)</MenuItem>
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

        {/* --- SECCIÓN DE CONTENIDO --- */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {currentSesiones.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {currentSesiones.map((sesion) => (
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
                    count={totalPages}
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
        <SesionDetailModal
          open={!!sesionToView}
          onClose={() => setSesionToView(null)}
          sesion={sesionToView}
        />
      )}
    </Box>
  );
}
