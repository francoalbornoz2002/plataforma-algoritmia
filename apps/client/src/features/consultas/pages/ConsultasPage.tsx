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
  Paper, // <-- Usaremos paginación
} from "@mui/material";
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

// Constante para la paginación
const PAGE_SIZE = 10;

export default function ConsultasPage() {
  const { selectedCourse } = useCourseContext();

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
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- Data Fetching ---
  const fetchConsultas = (currentPage: number) => {
    if (!selectedCourse) return;

    setLoading(true);
    setError(null);

    const params: FindConsultasParams = {
      page: currentPage,
      limit: PAGE_SIZE,
      sort: "fechaConsulta",
      order: "desc",
      search: debouncedSearchTerm,
      tema: filters.tema as temas | "",
      estado: filters.estado as estado_consulta | "",
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
  }, [selectedCourse, debouncedSearchTerm, filters, page]);

  // --- Handlers ---
  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1); // Resetea a la pág 1
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Resetea a la pág 1
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
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
    <Box>
      {/* --- 1. Filtros y Orden --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Buscar por título o descripción..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tema</InputLabel>
            <Select
              name="tema"
              value={filters.tema}
              label="Tema"
              onChange={handleFilterChange}
              sx={{ minWidth: 300 }}
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
        </Stack>
      </Paper>
      {/* --- 2. Lista de Consultas (Acordeones) --- */}
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {consultas.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron consultas con esos filtros.
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {/* --- ¡AQUÍ RENDERIZAMOS LOS ACORDEONES! --- */}
              {consultas.map((c) => (
                <ConsultaAccordion
                  key={c.id}
                  consulta={c}
                  onResponseSuccess={handleResponseSuccess}
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
    </Box>
  );
}
