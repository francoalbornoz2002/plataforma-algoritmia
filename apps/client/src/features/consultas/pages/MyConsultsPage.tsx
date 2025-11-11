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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  temas,
  estado_consulta,
  type Consulta,
  type FindConsultasParams,
} from "../../../types";

// Importamos el modal que acabamos de crear
import CreateConsultaModal from "../components/CreateConsultaModal";
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { getMyConsultas } from "../../users/services/alumnos.service";
import ValorarConsultaModal from "../components/ValorarConsultaModal";
import EditConsultaModal from "../components/EditConsultaModal";
import DeleteConsultaDialog from "../components/DeleteConsultaDialog";
import ConsultaAccordionAlumno from "../components/ConsultaAccordionAlumno";

const PAGE_SIZE = 5;

export default function MyConsultsPage() {
  const { selectedCourse } = useCourseContext();

  // Estados de la lista
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal
  // --- 2. Estados de los Modales ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Guarda la consulta que se va a valorar
  const [consultaToValorar, setConsultaToValorar] = useState<Consulta | null>(
    null
  );
  const [consultaToEdit, setConsultaToEdit] = useState<Consulta | null>(null); // <-- Nuevo
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(
    null
  ); //

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
  const fetchConsultas = () => {
    if (!selectedCourse) return;

    setLoading(true);
    setError(null);

    const params: FindConsultasParams = {
      page: 1, // (Por ahora traemos todo, no paginamos)
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
    fetchConsultas();
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
    fetchConsultas(); // Refresca la lista
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
      {/* --- 1. Cabecera y Botón "Nueva" --- */}
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Mis Consultas en {selectedCourse.nombre}
      </Typography>

      {/* --- 2. Filtros --- */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
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
                  {t}
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
                {e}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Nueva Consulta
        </Button>
      </Stack>

      {/* --- 3. Lista de Consultas (Cards) (ACTUALIZADO) --- */}
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
                  onEdit={() => setConsultaToEdit(c)}
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

      {/* Modal de Crear */}
      <CreateConsultaModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveSuccess}
        idCurso={selectedCourse.id}
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

      {/* Modal de Editar */}
      {consultaToEdit && (
        <EditConsultaModal
          open={!!consultaToEdit}
          onClose={() => setConsultaToEdit(null)}
          onSave={handleSaveSuccess}
          consultaToEdit={consultaToEdit}
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
