import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  Button,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
  Autocomplete,
  Checkbox,
  ListItemText,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CourseCard, { type CourseData } from "../components/CourseCard";
import { useDebounce } from "../../../hooks/useDebounce";
import type {
  CursoConDetalles,
  DocenteParaFiltro,
  estado_simple,
} from "../../../types";

import { estado_simple as EstadoSimpleEnum } from "../../../types";
import {
  deleteCourse,
  findCourses,
  finalizeCourse,
  findDocentesParaFiltro,
  type FindCoursesParams,
  type PaginatedCoursesResponse,
} from "../services/courses.service";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import CourseFormDialog from "../components/CourseFormDialog";
import { enqueueSnackbar } from "notistack";

// Definimos opciones de ordenamiento
const sortOptions = [
  { value: "nombre-asc", label: "Nombre (A-Z)" },
  { value: "nombre-desc", label: "Nombre (Z-A)" },
  { value: "createdAt-desc", label: "Más Recientes" },
  { value: "createdAt-asc", label: "Más Antiguas" },
  { value: "alumnos-desc", label: "Más Alumnos" },
  { value: "alumnos-asc", label: "Menos Alumnos" },
];

export default function CoursesPage() {
  /* ---------------------- ESTADOS ---------------------- */

  // ----- ESTADOS PARA LOS DATOS ----- //
  const [cursos, setCursos] = useState<CourseData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Para saber si está cargando los cursos.
  const [error, setError] = useState<string | null>(null); // Para settear errores.

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // ----- ESTADOS PARA LOS FILTROS ----- //
  // Filtro de búsqueda por texto
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda por nombre
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Custom hook para esperar 500 ms al teclear para realizar la búsqueda

  // Filtro por estado: Activo, Inactivo o Todos ("")
  const [estado, setEstado] = useState<estado_simple | "">("");

  //Filtro por docente/s
  const [selectedDocentes, setSelectedDocentes] = useState<DocenteParaFiltro[]>(
    [],
  );
  // Estados para cargar los docentes al filtro
  const [allDocentes, setAllDocentes] = useState<DocenteParaFiltro[]>([]);
  const [docentesLoading, setDocentesLoading] = useState(false);

  // ----- ESTADOS PARA PAGINACIÓN ----- //
  const [page, setPage] = useState(1); // Número de página
  const [limit, setLimit] = useState(4); // Limite de componentes Card por página

  // ----- ESTADO PARA ORDENAMIENTO ----- //
  const [sortField, setSortField] = useState("nombre"); // Campo a filtrar, por defecto nombre.
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Orden, por defencto ascendente.

  // ----- ESTADOS PARA LOS MODALES (para crear, editar y eliminar) ----- //
  // Estado del modal de creación o edición
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para settear el curso a editar
  // Este estado se le pasa como prop al Modal para crear o editar (CourseData para editar, null para crear).
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Estado para settear el curso a dar de baja
  const [courseToDeleteId, setCourseToDeleteId] = useState<string | null>(null);

  // Estado para settear el curso a finalizar
  const [courseToFinalizeId, setCourseToFinalizeId] = useState<string | null>(
    null,
  );

  // Estado del modal para confirmar la baja
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  // Estado de carga si se está eliminando el curso
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------------------- EFFECTS ---------------------- */

  // ----- EFFECT PARA CARGAR LOS DOCENTES AL FILTRO (sólo una vez) ----- //
  useEffect(() => {
    const fetchDocentes = async () => {
      setDocentesLoading(true);
      try {
        const docentesData = await findDocentesParaFiltro();
        setAllDocentes(docentesData);
      } catch (err) {
        console.error("Error al cargar lista de docentes:", err);
        // Opcional: mostrar un error al usuario
      } finally {
        setDocentesLoading(false);
      }
    };
    fetchDocentes();
  }, []); // Array de dependencias vacío, ya que se ejecuta solo una vez al renderizar.

  // --- EFFECT PARA FETCHING DE CURSOS --- //
  useEffect(() => {
    const fetchCursosData = async () => {
      setIsLoading(true);
      setError(null);

      // Mapeamos los docentes seleccionados a sus IDs
      const docenteIds = selectedDocentes.map((d) => d.id);

      const params: FindCoursesParams = {
        // Paginación
        page,
        limit,

        // Ordenamiento
        sort: sortField,
        order: sortOrder,

        // Filtros
        search: debouncedSearchTerm,
        docenteIds: docenteIds.length > 0 ? docenteIds : undefined, // undefined si está vacío
        estado: estado || undefined, // undefined si es ""
      };

      try {
        const response: PaginatedCoursesResponse = await findCourses(params);

        // Tranformamos los datos obtenidos para la CourseCard
        const mappedCursos: CourseData[] = response.data.map(
          (curso: CursoConDetalles) => ({
            id: curso.id,
            nombre: curso.nombre,
            // Handle potential null/undefined for image and deletedAt
            imagenUrl: curso.imagenUrl ?? undefined,
            createdAt: curso.createdAt ? new Date(curso.createdAt) : null,
            deletedAt: curso.deletedAt ? new Date(curso.deletedAt) : null,
            docentes: curso.docentes.map((dc) => ({
              // Mapeamos los datos del docente
              nombre: dc.docente?.nombre ?? "N/A",
              apellido: dc.docente?.apellido ?? "",
            })),
            alumnosInscriptos: curso._count?.alumnos ?? 0,
            estadoFinal: curso.progresoCurso?.estado,
          }),
        );

        setCursos(mappedCursos);
        setTotalPages(response.totalPages);
      } catch (err: any) {
        setError(err.message || "Error al cargar los cursos");
        setCursos([]); // Clear courses on error
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCursosData();
  }, [
    // Array de Dependencias
    // Este hook se re-ejecutará cada vez que uno de estos valores cambie
    debouncedSearchTerm,
    page,
    limit,
    sortField,
    sortOrder,
    estado,
    selectedDocentes,
    refetchTrigger,
  ]);

  // --- Handlers ---
  const handleAddCourseClick = () => {
    setEditingCourseId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (course: CourseData) => {
    setEditingCourseId(course.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCourseToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFinalize = (id: string) => {
    setCourseToFinalizeId(id);
    setIsFinalizeDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourseId(null);
  };

  const handleSaveCourse = async () => {
    // Logic for saving (create or update)
    handleCloseModal();
    setRefetchTrigger((prev) => prev + 1);
    setPage(1);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCourseToDeleteId(null);
  };

  const handleCloseFinalizeDialog = () => {
    setIsFinalizeDialogOpen(false);
    setCourseToFinalizeId(null);
  };

  const confirmDelete = async () => {
    if (!courseToDeleteId) return;

    setIsDeleting(true);
    setError(null); // Limpiar errores previos
    try {
      await deleteCourse(courseToDeleteId);
      enqueueSnackbar("Curso dado de baja con éxito", {
        variant: "success",
        autoHideDuration: 3000,
      });
      handleCloseDeleteDialog();
      // Forzamos el refetch
      setRefetchTrigger((prev) => prev + 1);
      // Opcional: mostrar un Snackbar/Toast de éxito
    } catch (err: any) {
      setError(err.message || "Error al dar de baja el curso.");
      enqueueSnackbar("Error al dar de baja el curso", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmFinalize = async () => {
    if (!courseToFinalizeId) return;

    setIsDeleting(true); // Reusamos estado de carga
    setError(null);
    try {
      await finalizeCourse(courseToFinalizeId);
      enqueueSnackbar("Curso finalizado con éxito. Pasó a historial.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      handleCloseFinalizeDialog();
      setRefetchTrigger((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "Error al finalizar el curso.");
      enqueueSnackbar("Error al finalizar el curso", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    const [field, order] = value.split("-");
    setSortField(field);
    setSortOrder(order as "asc" | "desc");
    setPage(1);
  };

  // --- AÑADIDOS: Handlers para nuevos filtros ---
  const handleEstadoChange = (event: SelectChangeEvent<string>) => {
    setEstado(event.target.value as estado_simple | "");
    setPage(1); // Resetear a página 1 al cambiar filtro
  };

  const handleDocentesChange = (
    event: React.SyntheticEvent,
    newValue: DocenteParaFiltro[],
  ) => {
    setSelectedDocentes(newValue);
    setPage(1); // Resetear a página 1 al cambiar filtro
  };

  // --- Render Logic ---
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* --- Filtros y botón de añadir curso --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Buscar curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
            variant="outlined"
          />
          {/* --- Filtro por ordenamiento --- */}
          <FormControl
            size="small"
            sx={{ minWidth: 200, width: { xs: "100%", sm: "auto" } }}
          >
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={`${sortField}-${sortOrder}`}
              label="Ordenar por"
              onChange={handleSortChange}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* --- Filtro de Docentes --- */}
          <Autocomplete
            multiple
            id="docentes-filter"
            options={allDocentes}
            loading={docentesLoading}
            value={selectedDocentes}
            onChange={handleDocentesChange}
            disableCloseOnSelect
            getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => {
              // Extraemos la key que React y MUI ponen en 'props'
              const { key, ...liProps } = props as any;
              return (
                <li key={key} {...liProps}>
                  {" "}
                  {/* Pasamos la key por separado */}
                  <Checkbox style={{ marginRight: 8 }} checked={selected} />
                  <ListItemText
                    primary={`${option.nombre} ${option.apellido}`}
                  />
                </li>
              );
            }}
            style={{ minWidth: 250 }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Docentes"
                placeholder="Buscar docente..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {docentesLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          {/* --- Filtro de Estado --- */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={estado} label="Estado" onChange={handleEstadoChange}>
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              <MenuItem value={EstadoSimpleEnum.Activo}>Activo</MenuItem>
              <MenuItem value={EstadoSimpleEnum.Inactivo}>Inactivo</MenuItem>
            </Select>
          </FormControl>
          <Box
            sx={{ flexGrow: { sm: 1 }, display: { xs: "none", sm: "block" } }}
          />{" "}
          {/* Spacer */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCourseClick}
            disabled={isLoading}
            sx={{ width: { xs: "100%", sm: "auto" }, mt: { xs: 1, sm: 0 } }}
          >
            Crear Curso
          </Button>
        </Stack>
      </Paper>

      {/* --- Loading / Error / Content --- */}
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* --- Grid for Cards --- */}
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {cursos.length > 0 ? (
                cursos.map((curso) => (
                  // --- AQUÍ LA CORRECCIÓN que tenías ---
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={curso.id}>
                    <CourseCard
                      course={curso}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onFinalize={handleFinalize}
                    />
                  </Grid>
                ))
              ) : (
                // --- Y AQUÍ TAMBIÉN ---
                <Grid size={12}>
                  {" "}
                  <Typography sx={{ textAlign: "center", mt: 4 }}>
                    No se encontraron cursos.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* --- Pagination --- */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 2,
                mt: "auto",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* --- Modals --- */}
      <CourseFormDialog
        open={isModalOpen}
        onClose={handleCloseModal}
        courseToEditId={editingCourseId}
        onSave={handleSaveCourse}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={confirmDelete}
        title="Confirmar Baja de Curso"
        description="¿Estás seguro de que quieres dar de baja este curso? Esta acción es reversible."
        isLoading={isDeleting}
      />

      <ConfirmationDialog
        open={isFinalizeDialogOpen}
        onClose={handleCloseFinalizeDialog}
        onConfirm={confirmFinalize}
        title="Confirmar Finalización de Curso"
        description="¿Estás seguro de finalizar este curso? Se cerrarán las actas, se cancelarán clases pendientes y pasará a modo 'Solo Lectura' para el historial. Esta acción marca el fin del ciclo lectivo."
        isLoading={isDeleting}
      />
    </Box>
  );
}
