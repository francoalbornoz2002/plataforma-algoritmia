import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Pagination,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import AddIcon from "@mui/icons-material/Add";
// Hooks, services, types
import { useDebounce } from "../../../hooks/useDebounce";
import { preguntasService } from "../../preguntas/service/preguntas.service";

import {
  type PreguntaConDetalles,
  type DificultadConTema,
  temas,
  grado_dificultad,
  type FindPreguntasParams,
} from "../../../types";

// Components
import PreguntaAccordion from "../../preguntas/components/PreguntaAccordion";

// Asumimos que estos componentes existen y siguen el patrón de diseño de la app
import PreguntaFormDialog from "../../preguntas/components/PreguntaFormDialog";
import DeletePreguntaDialog from "../../preguntas/components/DeletePreguntaDialog";
import { getAllDifficulties } from "../../users/services/docentes.service";

const PAGE_SIZE = 5;

interface AddExtraPreguntaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: PreguntaConDetalles[]) => void;
  limit: number;
  initialSelection: PreguntaConDetalles[];
  // Nuevas props para forzar el filtro
  idDificultadFiltro: string;
  gradoSesionFiltro: grado_dificultad;
}

export default function AddExtraPreguntaModal({
  open,
  onClose,
  onConfirm,
  limit,
  initialSelection,
  idDificultadFiltro,
  gradoSesionFiltro,
}: AddExtraPreguntaModalProps) {
  // --- Estados de la lista y selección ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaConDetalles[]>([]);
  const [selectedPreguntas, setSelectedPreguntas] = useState<
    PreguntaConDetalles[]
  >([]);

  // --- Estados para filtros y paginación ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    tema: "",
    gradoDificultad: "",
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

  // --- Estados para CRUD de preguntas anidado ---
  const [isPreguntaFormOpen, setIsPreguntaFormOpen] = useState(false);
  const [preguntaToEdit, setPreguntaToEdit] =
    useState<PreguntaConDetalles | null>(null);
  const [preguntaToDelete, setPreguntaToDelete] =
    useState<PreguntaConDetalles | null>(null);

  // --- Data Fetching para filtros ---
  useEffect(() => {
    if (open) {
      // Ahora necesita el id del curso
      getAllDifficulties()
        .then((data) => setAllDifficulties(data))
        .catch(() =>
          enqueueSnackbar("Error al cargar dificultades para filtro.", {
            variant: "error",
          })
        );
    }
  }, [open]);

  // Efecto para establecer los filtros forzados al abrir el modal
  useEffect(() => {
    if (
      open &&
      idDificultadFiltro &&
      gradoSesionFiltro &&
      allDifficulties.length > 0
    ) {
      const dificultadSeleccionada = allDifficulties.find(
        (d) => d.id === idDificultadFiltro
      );
      setFilters({
        idDificultad: idDificultadFiltro,
        gradoDificultad: gradoSesionFiltro,
        tema: dificultadSeleccionada?.tema || "",
      });
    }
  }, [open, idDificultadFiltro, gradoSesionFiltro, allDifficulties]);

  // Efecto para filtrar las dificultades según el tema seleccionado
  useEffect(() => {
    if (filters.tema) {
      setFilteredDifficulties(
        allDifficulties.filter((d) => d.tema === filters.tema)
      );
    } else {
      setFilteredDifficulties(allDifficulties);
    }
  }, [filters.tema, allDifficulties]);

  // --- Data Fetching ---
  const fetchPreguntas = useCallback(
    (currentPage: number) => {
      setLoading(true);
      setError(null);

      const params: FindPreguntasParams = {
        page: currentPage,
        limit: PAGE_SIZE,
        sort: "createdAt",
        order: "desc",
        search: debouncedSearchTerm,
        tipo: "docente", // Siempre buscamos preguntas de docente
        ...(filters.tema && { tema: filters.tema as temas }),
        ...(filters.gradoDificultad && {
          gradoDificultad: filters.gradoDificultad as grado_dificultad,
        }),
        ...(filters.idDificultad && { idDificultad: filters.idDificultad }),
      };

      preguntasService
        .findAll(params)
        .then((response) => {
          setPreguntas(response.data);
          setTotalPages(response.meta.totalPages);
        })
        .catch((err) =>
          setError(err.message || "Error al cargar las preguntas.")
        )
        .finally(() => setLoading(false));
    },
    [debouncedSearchTerm, filters]
  );

  // Efecto que reacciona a los filtros, búsqueda y paginación
  useEffect(() => {
    if (open) {
      fetchPreguntas(page);
    }
  }, [open, page, fetchPreguntas]);

  // Efecto para inicializar la selección cuando se abre el modal
  useEffect(() => {
    if (open) {
      setSelectedPreguntas(initialSelection);
    }
  }, [open, initialSelection]);

  // --- Handlers ---
  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
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

  const handleOpenCreatePregunta = () => {
    setPreguntaToEdit(null);
    setIsPreguntaFormOpen(true);
  };

  const handleEditPregunta = (pregunta: PreguntaConDetalles) => {
    setPreguntaToEdit(pregunta);
    setIsPreguntaFormOpen(true);
  };

  const handleSavePreguntaSuccess = () => {
    setIsPreguntaFormOpen(false);
    // Recargamos la página actual para ver el cambio
    fetchPreguntas(page);
  };

  const handleDeletePreguntaSuccess = () => {
    if (!preguntaToDelete) return;
    // 1. Remove the deleted question from the current selection state
    setSelectedPreguntas((prev) =>
      prev.filter((p) => p.id !== preguntaToDelete.id)
    );
    // 2. Refetch the list of available questions to update the view
    fetchPreguntas(page);
  };

  const handleToggleSelection = (pregunta: PreguntaConDetalles) => {
    setSelectedPreguntas((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === pregunta.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== pregunta.id);
      } else {
        if (prevSelected.length >= limit) {
          enqueueSnackbar(
            `Solo puedes seleccionar hasta ${limit} preguntas extra.`,
            {
              variant: "warning",
            }
          );
          return prevSelected;
        }
        return [...prevSelected, pregunta];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedPreguntas);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Añadir Preguntas Extra</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
          {/* --- Filtros --- */}
          <Paper elevation={2} sx={{ p: 2, mb: 2, flexShrink: 0 }}>
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
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Tema</InputLabel>
                <Select
                  name="tema"
                  value={filters.tema}
                  label="Tema"
                  disabled // Deshabilitado
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
              <FormControl size="small" sx={{ width: 300 }}>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  name="idDificultad"
                  value={filters.idDificultad}
                  label="Dificultad"
                  disabled // Deshabilitado
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {filteredDifficulties.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Grado</InputLabel>
                <Select
                  name="gradoDificultad"
                  value={filters.gradoDificultad}
                  label="Grado"
                  disabled // Deshabilitado
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
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreatePregunta}
              >
                Crear Pregunta
              </Button>
            </Stack>
          </Paper>

          {/* --- Lista de Preguntas --- */}
          <Box
            sx={{
              mt: 1,
              flexGrow: 1,
              minHeight: "50vh", // Altura mínima para evitar el salto
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <>
                {preguntas.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No se encontraron preguntas con los filtros aplicados.
                  </Alert>
                ) : (
                  <Box sx={{ overflowY: "auto", flex: 1, pr: 1 }}>
                    <Stack spacing={1.5}>
                      {preguntas.map((p) => {
                        const isSelected = selectedPreguntas.some(
                          (sp) => sp.id === p.id
                        );
                        const isDisabled =
                          !isSelected && selectedPreguntas.length >= limit;
                        return (
                          <Box
                            key={p.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => handleToggleSelection(p)}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <PreguntaAccordion
                                pregunta={p}
                                onEdit={handleEditPregunta}
                                onDelete={setPreguntaToDelete}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {totalPages > 1 && (
                  <Stack alignItems="center" sx={{ pt: 2, flexShrink: 0 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      disabled={loading}
                    />
                  </Stack>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained">
            Confirmar Selección ({selectedPreguntas.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Modales Anidados --- */}
      <PreguntaFormDialog
        open={isPreguntaFormOpen}
        onClose={() => setIsPreguntaFormOpen(false)}
        onSave={handleSavePreguntaSuccess}
        preguntaToEdit={preguntaToEdit}
      />

      {preguntaToDelete && (
        <DeletePreguntaDialog
          open={!!preguntaToDelete}
          onClose={() => setPreguntaToDelete(null)}
          onDeleteSuccess={handleDeletePreguntaSuccess}
          preguntaToDelete={preguntaToDelete}
        />
      )}
    </>
  );
}
