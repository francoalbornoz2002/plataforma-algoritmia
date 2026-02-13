import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Pagination,
  Paper,
  Tooltip,
  IconButton, // <-- Usaremos paginación
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { findConsultas } from "../../users/services/docentes.service"; // <-- Servicio del Docente
import {
  temas,
  estado_consulta,
  type FindConsultasParams,
  type ConsultaDocente,
} from "../../../types";

// Importamos el acordeón que acabamos de crear
import ConsultaAccordion from "../components/ConsultaAccordion";
import { EstadoConsultaLabels, TemasLabels } from "../../../types/traducciones";
import HeaderPage from "../../../components/HeaderPage";
import { FilterAltOff, MarkUnreadChatAlt } from "@mui/icons-material";
import { datePickerConfig } from "../../../config/theme.config";

// Constante para la paginación
const PAGE_SIZE = 10;

export default function ConsultasPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();

  // Estados de la lista
  const [consultas, setConsultas] = useState<ConsultaDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros y paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    tema: "",
    estado: "",
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Estado para ordenamiento
  const [sortOption, setSortOption] = useState("recent"); // recent, old, az, za

  // --- Data Fetching ---
  const fetchConsultas = (currentPage: number) => {
    if (!selectedCourse) return;

    setLoading(true);
    setError(null);

    let sort = "fechaConsulta";
    let order: "asc" | "desc" = "desc";

    if (sortOption === "recent") {
      sort = "fechaConsulta";
      order = "desc";
    } else if (sortOption === "old") {
      sort = "fechaConsulta";
      order = "asc";
    } else if (sortOption === "az") {
      sort = "titulo";
      order = "asc";
    } else if (sortOption === "za") {
      sort = "titulo";
      order = "desc";
    }

    const params: FindConsultasParams = {
      page: currentPage,
      limit: PAGE_SIZE,
      sort,
      order,
      search: debouncedSearchTerm,
      tema: filters.tema as temas | "",
      estado: filters.estado as estado_consulta | "",
      fechaDesde: filters.fechaDesde
        ? format(filters.fechaDesde, "yyyy-MM-dd")
        : undefined,
      fechaHasta: filters.fechaHasta
        ? format(filters.fechaHasta, "yyyy-MM-dd")
        : undefined,
    };

    findConsultas(selectedCourse.id, params)
      .then((response) => {
        setConsultas(response.data);
        setTotalPages(response.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Efecto que reacciona a los filtros y a la página
  useEffect(() => {
    fetchConsultas(page);
  }, [selectedCourse, debouncedSearchTerm, filters, page, sortOption]);

  // --- Handlers ---
  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1); // Resetea a la pág 1
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      tema: "",
      estado: "",
      fechaDesde: null,
      fechaHasta: null,
    });
    setSortOption("recent");
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Resetea a la pág 1
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleResponseSuccess = () => {
    // Refresca la lista en la página actual
    fetchConsultas(page);
  };

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver las consultas.
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
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Consultas en ${selectedCourse.nombre}`}
          description="Gestiona y responde las dudas planteadas por los alumnos del curso."
          icon={<MarkUnreadChatAlt />}
          color="primary"
        />

        {/* --- 1. Filtros y Orden --- */}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField
            label="Buscar por título o descripción..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel>Tema</InputLabel>
            <Select
              name="tema"
              value={filters.tema}
              label="Tema"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(temas)
                .filter((t) => t !== temas.Ninguno)
                .map((t) => (
                  <MenuItem key={t} value={t}>
                    {TemasLabels[t]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              value={filters.estado}
              label="Estado"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(estado_consulta).map((e) => (
                <MenuItem key={e} value={e}>
                  {EstadoConsultaLabels[e]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePicker
            label="Desde"
            value={filters.fechaDesde}
            onChange={(newValue) => {
              setFilters((prev) => ({ ...prev, fechaDesde: newValue }));
              setPage(1);
            }}
            {...datePickerConfig}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    width: 170,
                  },
                },
                sx: { width: 170 },
              },
            }}
          />
          <DatePicker
            label="Hasta"
            value={filters.fechaHasta}
            onChange={(newValue) => {
              setFilters((prev) => ({ ...prev, fechaHasta: newValue }));
              setPage(1);
            }}
            {...datePickerConfig}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    width: 170,
                  },
                },
                sx: { width: 170 },
              },
            }}
          />

          <Tooltip title="Limpiar filtros">
            <IconButton
              onClick={handleClearFilters}
              size="small"
              color="primary"
            >
              <FilterAltOff />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortOption}
              label="Ordenar por"
              onChange={(e) => setSortOption(e.target.value)}
            >
              <MenuItem value="recent">Más recientes</MenuItem>
              <MenuItem value="old">Más antiguas</MenuItem>
              <MenuItem value="az">Título (A-Z)</MenuItem>
              <MenuItem value="za">Título (Z-A)</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* --- 2. Lista de Consultas (Acordeones) --- */}
        {loading ? (
          <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {consultas.length === 0 ? (
              <Alert severity="info">
                No se encontraron consultas con esos filtros.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {/* --- ¡AQUÍ RENDERIZAMOS LOS ACORDEONES! --- */}
                {consultas.map((c) => (
                  <ConsultaAccordion
                    key={c.id}
                    consulta={c}
                    onResponseSuccess={
                      !isReadOnly ? handleResponseSuccess : undefined
                    }
                  />
                ))}
              </Stack>
            )}

            {/* --- 3. Paginación --- */}
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                disabled={loading}
              />
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
