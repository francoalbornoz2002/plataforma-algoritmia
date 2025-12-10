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
  grado_dificultad,
  type PreguntaConDetalles,
  type DificultadConTema,
  type FindPreguntasParams,
} from "../../../types";
import { useDebounce } from "../../../hooks/useDebounce";
import { preguntasService } from "../service/preguntas.service";

import PreguntaAccordion from "../components/PreguntaAccordion";
import PreguntaFormDialog from "../components/PreguntaFormDialog";
import DeletePreguntaDialog from "../components/DeletePreguntaDialog";

const PAGE_SIZE = 5;

import { getAllDifficulties } from "../../users/services/docentes.service";
export default function PreguntasPage() {
  // Estados de la lista
  const [preguntas, setPreguntas] = useState<PreguntaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de los modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [preguntaToEdit, setPreguntaToEdit] =
    useState<PreguntaConDetalles | null>(null);
  const [preguntaToDelete, setPreguntaToDelete] =
    useState<PreguntaConDetalles | null>(null);

  // Estados para filtros y paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    tema: "",
    gradoDificultad: "",
    tipo: "",
    idDificultad: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [allDifficulties, setAllDifficulties] = useState<DificultadConTema[]>(
    []
  );
  const [filteredDifficulties, setFilteredDifficulties] = useState<
    DificultadConTema[]
  >([]);

  // --- Data Fetching para filtros ---
  useEffect(() => {
    getAllDifficulties()
      .then((data) => setAllDifficulties(data))
      .catch((err) =>
        console.error("Error al cargar dificultades para filtro", err)
      );
  }, []);

  // Efecto para filtrar las dificultades según el tema seleccionado
  useEffect(() => {
    if (filters.tema) {
      setFilteredDifficulties(
        allDifficulties.filter((d) => d.tema === filters.tema)
      );
    } else {
      setFilteredDifficulties(allDifficulties); // Mostrar todas si no hay tema
    }
  }, [filters.tema, allDifficulties]);

  // --- Data Fetching ---
  const fetchPreguntas = (currentPage: number) => {
    setLoading(true);
    setError(null);

    const params: FindPreguntasParams = {
      page: currentPage,
      limit: PAGE_SIZE,
      sort: "createdAt",
      order: "desc",
      search: debouncedSearchTerm,
      // Solo incluimos los filtros si tienen un valor seleccionado (no son cadena vacía)
      ...(filters.tema && { tema: filters.tema as temas }),
      ...(filters.gradoDificultad && {
        gradoDificultad: filters.gradoDificultad as grado_dificultad,
      }),
      ...(filters.idDificultad && { idDificultad: filters.idDificultad }),
      ...(filters.tipo && {
        tipo: filters.tipo as "sistema" | "docente",
      }),
    };

    preguntasService
      .findAll(params)
      .then((response) => {
        setPreguntas(response.data);
        setTotalPages(response.meta.totalPages);
      })
      .catch((err) => setError(err.message || "Error al cargar las preguntas."))
      .finally(() => setLoading(false));
  };

  // Efecto que reacciona a los filtros, búsqueda y paginación
  useEffect(() => {
    fetchPreguntas(page);
  }, [debouncedSearchTerm, filters, page]);

  // --- Handlers ---
  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [name]: value,
      };
      // Si el tema cambia, reseteamos la dificultad seleccionada
      if (name === "tema") {
        newFilters.idDificultad = "";
      }
      return newFilters;
    });
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
    fetchPreguntas(page);
  };

  const handleDeleteSuccess = () => {
    if (preguntas.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      fetchPreguntas(page);
    }
  };

  return (
    <Box>
      {/* --- 1. Filtros y Acción Principal --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Buscar por enunciado..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Dificultad</InputLabel>
            <Select
              name="idDificultad"
              value={filters.idDificultad}
              label="Dificultad"
              onChange={handleFilterChange}
              disabled={allDifficulties.length === 0}
            >
              <MenuItem value="">Todas</MenuItem>
              {filteredDifficulties.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Grado</InputLabel>
            <Select
              name="gradoDificultad"
              value={filters.gradoDificultad}
              label="Grado"
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              name="tipo"
              value={filters.tipo}
              label="Tipo"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="sistema">Sistema</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setPreguntaToEdit(null);
              setIsFormModalOpen(true);
            }}
          >
            Crear Pregunta
          </Button>
        </Stack>
      </Paper>

      {/* --- 2. Lista de Preguntas --- */}
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {preguntas.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron preguntas con los filtros aplicados.
            </Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {preguntas.map((p) => (
                <PreguntaAccordion
                  key={p.id}
                  pregunta={p}
                  onEdit={() => {
                    setPreguntaToEdit(p);
                    setIsFormModalOpen(true);
                  }}
                  onDelete={() => setPreguntaToDelete(p)}
                />
              ))}
            </Stack>
          )}

          {/* --- Paginación --- */}
          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                disabled={loading}
              />
            </Stack>
          )}
        </Box>
      )}

      {/* --- Modales --- */}
      <PreguntaFormDialog
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSuccess}
        preguntaToEdit={preguntaToEdit}
      />

      {preguntaToDelete && (
        <DeletePreguntaDialog
          open={!!preguntaToDelete}
          onClose={() => setPreguntaToDelete(null)}
          onDeleteSuccess={handleDeleteSuccess}
          preguntaToDelete={preguntaToDelete}
        />
      )}
    </Box>
  );
}
