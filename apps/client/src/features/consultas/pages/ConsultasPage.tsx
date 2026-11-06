import { useState, useEffect } from "react";
import {
  Box,
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
  Tooltip,
  IconButton, // <-- Usaremos paginación
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { findConsultas } from "../services/consultas.service";

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
  const [sortOption, setSortOption] = useState("titulo-asc");
  const [hasSelectedSortOption, setHasSelectedSortOption] = useState(true);

  const sortDirectionIcon = (field: string) => {
    if (sortOption === `${field}-asc`)
      return <ArrowUpwardIcon fontSize="small" />;
    if (sortOption === `${field}-desc`)
      return <ArrowDownwardIcon fontSize="small" />;
    return null;
  };
  const sortOptionLabel = (label: string, field: string) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <span>{label}</span>
      {sortDirectionIcon(field)}
    </Box>
  );
  const nextSortOption = (field: string) => {
    const [currentField, currentOrder] = sortOption.split("-");
    if (!hasSelectedSortOption || currentField !== field) return `${field}-asc`;
    return `${field}-${currentOrder === "asc" ? "desc" : "asc"}`;
  };

  // --- Data Fetching ---
  const fetchConsultas = (currentPage: number) => {
    if (!selectedCourse) return;

    setLoading(true);
    setError(null);

    const [sortField, sortOrder] = sortOption.split("-");
    const sort = sortField === "titulo" ? "titulo" : "createdAt";
    const order: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

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

  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setSortOption(e.target.value);
    setHasSelectedSortOption(true);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      tema: "",
      estado: "",
      fechaDesde: null,
      fechaHasta: null,
    });
    setSortOption("titulo-asc");
    setHasSelectedSortOption(true);
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
        minWidth: 0,
      }}
    >
      <Stack spacing={2} sx={{ height: "100%", minWidth: 0 }}>
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Consultas en ${selectedCourse.nombre}`}
          description="Gestiona y responde las dudas planteadas por los alumnos del curso."
          icon={<MarkUnreadChatAlt />}
          color="info"
        />

        {/* --- 1. Filtros y Orden --- */}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <DatePicker
            label="Fecha Desde"
            disableFuture
            value={filters.fechaDesde}
            maxDate={filters.fechaHasta || undefined}
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
            label="Fecha Hasta"
            disableFuture
            value={filters.fechaHasta}
            minDate={filters.fechaDesde || undefined}
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
          <TextField
            label="Buscar por título o descripción..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />

          <FormControl size="small" sx={{ width: 250 }}>
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
          <FormControl size="small" sx={{ width: 150 }}>
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
              value={hasSelectedSortOption ? sortOption : ""}
              label="Ordenar por"
              onChange={handleSortChange}
              displayEmpty
              renderValue={() => {
                const [field] = sortOption.split("-");
                const labels: Record<string, string> = {
                  fecha: "Fecha",
                  titulo: "Título",
                };
                return sortOptionLabel(labels[field], field);
              }}
            >
              <MenuItem value={nextSortOption("fecha")}>
                {sortOptionLabel("Fecha", "fecha")}
              </MenuItem>
              <MenuItem value={nextSortOption("titulo")}>
                {sortOptionLabel("Título", "titulo")}
              </MenuItem>
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
