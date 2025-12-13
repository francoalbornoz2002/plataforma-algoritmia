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
  Button,
  type SelectChangeEvent,
  Pagination,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  temas,
  estado_consulta,
  type Consulta,
  type FindConsultasParams,
} from "../../../types";

// Importamos el modal que acabamos de crear
import ConsultaFormDialog from "../components/ConsultaFormDialog";
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { getMyConsultas } from "../../users/services/alumnos.service";
import ValorarConsultaModal from "../components/ValorarConsultaModal"; // <-- Nuevo
import DeleteConsultaDialog from "../components/DeleteConsultaDialog";
import ConsultaAccordionAlumno from "../components/ConsultaAccordionAlumno";
import { EstadoConsultaLabels, TemasLabels } from "../../../types/traducciones";

const PAGE_SIZE = 5;

export default function MyConsultsPage() {
  const { selectedCourse } = useCourseContext();

  // Estados de la lista
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);

  // Guarda la consulta que se va a valorar
  const [consultaToValorar, setConsultaToValorar] = useState<Consulta | null>(
    null
  );
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(
    null
  );

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
      page: currentPage, // (Por ahora traemos todo, no paginamos)
      limit: PAGE_SIZE,
      sort: "fechaConsulta",
      order: "desc",
      search: debouncedSearchTerm,
      tema: filters.tema as temas | "",
      estado: filters.estado as estado_consulta | "",
    };

    getMyConsultas(selectedCourse.id, params)
      .then((response) => {
        setConsultas(response.data);
        setTotalPages(response.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Efecto que reacciona a los filtros
  useEffect(() => {
    fetchConsultas(page);
  }, [selectedCourse, debouncedSearchTerm, filters, page]); // Refresca si cambia el curso o filtros

  // --- Handlers ---
  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const handleSaveSuccess = () => {
    fetchConsultas(page); // Refresca la lista
  };

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú para ver tus consultas.
      </Alert>
    );
  }

  return (
    <Box>
      {/* --- 1. Filtros --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
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
            sx={{ minWidth: 250, maxWidth: 600, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingConsulta(null);
              setIsFormModalOpen(true);
            }}
          >
            Nueva Consulta
          </Button>
        </Stack>
      </Paper>

      {/* --- 2. Lista de Consultas (Cards) --- */}
      <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
        Consultas realizadas
      </Typography>
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {consultas.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron consultas con esos filtros. ¡O crea una nueva!
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {" "}
              {/* 7. Usamos Stack (no spacing=2) */}
              {consultas.map((c) => (
                <ConsultaAccordionAlumno // <-- Usamos el nuevo acordeón
                  key={c.id}
                  consulta={c}
                  onValorar={() => setConsultaToValorar(c)}
                  onEdit={() => {
                    setEditingConsulta(c);
                    setIsFormModalOpen(true);
                  }}
                  onDelete={() => setConsultaToDelete(c)}
                />
              ))}
            </Stack>
          )}

          {/* --- 8. Paginación --- */}
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

      {/* --- 4. Modales --- */}

      {/* Modal de Crear/Editar */}
      <ConsultaFormDialog
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSuccess}
        idCurso={selectedCourse.id}
        consultaToEdit={editingConsulta}
      />

      {/* Modal de Valorar */}
      {consultaToValorar && (
        <ValorarConsultaModal
          open={!!consultaToValorar}
          onClose={() => setConsultaToValorar(null)}
          onSave={handleSaveSuccess}
          consulta={consultaToValorar}
        />
      )}

      {/* Modal de Borrar */}
      {consultaToDelete && (
        <DeleteConsultaDialog
          open={!!consultaToDelete}
          onClose={() => setConsultaToDelete(null)}
          onDeleteSuccess={handleSaveSuccess}
          consultaToDelete={consultaToDelete}
        />
      )}
    </Box>
  );
}
