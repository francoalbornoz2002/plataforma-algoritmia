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
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import {
  temas,
  estado_consulta,
  type Consulta,
  type ConsultaDocente,
  type FindConsultasParams,
} from "../../../types";

// Importamos el modal que acabamos de crear
import ConsultaFormDialog from "../components/ConsultaFormDialog";
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getMyConsultas,
  getPublicConsultas,
} from "../../users/services/alumnos.service";
import ValorarConsultaModal from "../components/ValorarConsultaModal"; // <-- Nuevo
import DeleteConsultaDialog from "../components/DeleteConsultaDialog";
import ConsultaAccordionAlumno from "../components/ConsultaAccordionAlumno";
import ConsultaPublicaAccordion from "../components/ConsultaPublicaAccordion";
import { EstadoConsultaLabels, TemasLabels } from "../../../types/traducciones";
import HeaderPage from "../../../components/HeaderPage";
import { MarkUnreadChatAlt } from "@mui/icons-material";

const PAGE_SIZE = 5;

export default function MyConsultsPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();

  // Estados de la lista
  const [consultas, setConsultas] = useState<(Consulta | ConsultaDocente)[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);

  // Guarda la consulta que se va a valorar
  const [consultaToValorar, setConsultaToValorar] = useState<Consulta | null>(
    null,
  );
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(
    null,
  );

  // Estados para filtros y paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    scope: "mine", // 'mine' | 'public'
    tema: "",
    estado: "",
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Estado para ordenamiento
  const [sortOption, setSortOption] = useState("recent");

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
      page: currentPage, // (Por ahora traemos todo, no paginamos)
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

    if (filters.scope === "mine") {
      getMyConsultas(selectedCourse.id, params)
        .then((response) => {
          setConsultas(response.data);
          setTotalPages(response.totalPages);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // Consultas Públicas
      getPublicConsultas(selectedCourse.id, params)
        .then((response) => {
          setConsultas(response.data);
          setTotalPages(response.totalPages);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  // Efecto que reacciona a los filtros
  useEffect(() => {
    fetchConsultas(page);
  }, [selectedCourse, debouncedSearchTerm, filters, page, sortOption]); // Refresca si cambia el curso o filtros

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
    value: number,
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
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ width: "100%" }}>
        <HeaderPage
          title={`${
            filters.scope === "mine"
              ? "Mis Consultas en"
              : "Consultas del Curso"
          } ${selectedCourse.nombre}`}
          description="Gestiona tus consultas y revisa las realizadas por tus
                compañeros de curso."
          icon={<MarkUnreadChatAlt />}
          color="primary"
        />
        {/* --- 1. Filtros --- */}
        <Paper elevation={2} sx={{ pt: 1, pb: 2, pr: 2, pl: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="overline" sx={{ fontSize: "14px" }}>
              Filtros de búsqueda
            </Typography>
            <Chip
              label="Mis Consultas"
              color={filters.scope === "mine" ? "primary" : "default"}
              onClick={() => {
                setFilters((prev) => ({ ...prev, scope: "mine" }));
                setPage(1);
              }}
              variant={filters.scope === "mine" ? "filled" : "outlined"}
              clickable
              size="small"
            />
            <Chip
              label="Consultas del Curso"
              color={filters.scope === "public" ? "primary" : "default"}
              onClick={() => {
                setFilters((prev) => ({ ...prev, scope: "public" }));
                setPage(1);
              }}
              variant={filters.scope === "public" ? "filled" : "outlined"}
              clickable
              size="small"
            />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField
              label="Buscar por título o descripción..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: 260 }}
            />
            <DatePicker
              label="Desde"
              value={filters.fechaDesde}
              onChange={(newValue) => {
                setFilters((prev) => ({ ...prev, fechaDesde: newValue }));
                setPage(1);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: 165 } },
              }}
            />
            <DatePicker
              label="Hasta"
              value={filters.fechaHasta}
              onChange={(newValue) => {
                setFilters((prev) => ({ ...prev, fechaHasta: newValue }));
                setPage(1);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: 165 } },
              }}
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
            {filters.scope === "mine" && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
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
            )}
            <Box sx={{ flexGrow: 1 }} />
            {!isReadOnly && (
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
            )}
          </Stack>
        </Paper>
        <Stack spacing={2}>
          {/* --- 2. Lista de Consultas (Cards) --- */}
          {loading ? (
            <CircularProgress
              sx={{ display: "block", margin: "auto", mt: 4 }}
            />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box>
              {consultas.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No se encontraron consultas con esos filtros. ¡O crea una
                  nueva!
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {" "}
                  {/* 7. Usamos Stack (no spacing=2) */}
                  {consultas.map((c) => {
                    // Verificamos si la data tiene la propiedad 'alumno' para saber qué componente renderizar.
                    // Esto evita crashes cuando filters.scope cambia pero 'consultas' aún tiene la data vieja.
                    const isPublicData = "alumno" in c;

                    if (!isPublicData) {
                      return (
                        <ConsultaAccordionAlumno
                          key={c.id}
                          consulta={c as Consulta}
                          onValorar={
                            !isReadOnly
                              ? () => setConsultaToValorar(c as Consulta)
                              : undefined
                          }
                          onEdit={
                            !isReadOnly
                              ? () => {
                                  setEditingConsulta(c as Consulta);
                                  setIsFormModalOpen(true);
                                }
                              : undefined
                          }
                          onDelete={
                            !isReadOnly
                              ? () => setConsultaToDelete(c as Consulta)
                              : undefined
                          }
                        />
                      );
                    } else {
                      // Vista pública (ConsultaDocente)
                      return (
                        <ConsultaPublicaAccordion
                          key={c.id}
                          consulta={c as ConsultaDocente}
                        />
                      );
                    }
                  })}
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
        </Stack>

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
      </Stack>
    </Box>
  );
}
