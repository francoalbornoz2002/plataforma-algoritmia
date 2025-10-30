// src/pages/Courses/CoursesPage.tsx
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
  Pagination, // Import Pagination
  Select, // Import Select for sorting
  MenuItem, // Import MenuItem for sorting
  FormControl, // Import FormControl for sorting
  InputLabel,
  type SelectChangeEvent, // Import InputLabel for sorting
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CourseCard, { type CourseData } from "./CourseCard";
import { useDebounce } from "../../../hooks/useDebounce";
import type {
  CursoConDetalles,
  FindCoursesParams,
  PaginatedCoursesResponse,
} from "../../../types";
import { findCourses } from "../../../services/courses.service";

// Define sort options
const sortOptions = [
  { field: "nombre", label: "Nombre A-Z" },
  { field: "createdAt", label: "Más Recientes" },
  // Add more as needed
];

export default function CoursesPage() {
  // --- Data State ---
  const [cursos, setCursos] = useState<CourseData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // (Add more filter states here later if needed, e.g., teacher filter)

  // --- Pagination State ---
  const [page, setPage] = useState(1); // Page numbers usually start from 1 for UI
  const [limit, setLimit] = useState(8); // How many cards per page (adjust as needed)

  // --- Sorting State ---
  const [sortField, setSortField] = useState("nombre"); // Default sort field
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Default sort order

  // --- Modal States (for create/edit/delete) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDeleteId, setCourseToDeleteId] = useState<string | null>(null);
  // (Add loading states for delete/save if needed)

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchCursosData = async () => {
      setIsLoading(true);
      setError(null);

      const params: FindCoursesParams = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
        search: debouncedSearchTerm,
        // Add other filter params here
      };

      try {
        const response: PaginatedCoursesResponse = await findCourses(params);

        // Transform data for the CourseCard
        const mappedCursos: CourseData[] = response.data.map(
          (curso: CursoConDetalles) => ({
            id: curso.id,
            nombre: curso.nombre,
            // Handle potential null/undefined for image and deletedAt
            imagenUrl: curso.imagenUrl ?? undefined,
            deletedAt: curso.deletedAt ? new Date(curso.deletedAt) : null,
            docentes: curso.docentes.map((dc) => ({
              // Safely map teachers
              nombre: dc.docente?.nombre ?? "N/A",
              apellido: dc.docente?.apellido ?? "",
            })),
            alumnosInscriptos: curso._count?.alumnos ?? 0, // Use nullish coalescing
          })
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
  }, [debouncedSearchTerm, page, limit, sortField, sortOrder]); // Dependencies trigger refetch

  // --- Handlers ---
  const handleAddCourseClick = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (course: CourseData) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCourseToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSaveCourse = async () => {
    // Logic for saving (create or update)
    handleCloseModal();
    setPage(1); // Go back to first page after save to see changes
    // Optionally trigger refetch immediately if needed, though setPage will do it
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCourseToDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!courseToDeleteId) return;
    // Add delete logic using course service
    console.log("Deleting course:", courseToDeleteId);
    handleCloseDeleteDialog();
    setPage(1); // Go back to first page
    // Optionally trigger refetch
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const selectedField = event.target.value;
    // Basic toggle logic: if selecting the same field, toggle order, else default to asc
    if (selectedField === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(selectedField);
      setSortOrder("asc");
    }
    setPage(1); // Reset to page 1 when sorting changes
  };

  // --- Render Logic ---
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Gestión de Cursos
      </Typography>

      {/* --- Filter and Action Bar --- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems="center"
      >
        <TextField
          label="Buscar curso..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }} // Reset page on search change
          sx={{ flexGrow: { sm: 1 }, width: { xs: "100%", sm: "auto" } }}
        />
        {/* --- Sorting Dropdown --- */}
        <FormControl
          size="small"
          sx={{ minWidth: 180, width: { xs: "100%", sm: "auto" } }}
        >
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={sortField}
            label="Ordenar por"
            onChange={handleSortChange}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.field} value={option.field}>
                {option.label}{" "}
                {sortField === option.field
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* (Add other filters here) */}
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
          Añadir Curso
        </Button>
      </Stack>

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
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={3}>
              {cursos.length > 0 ? (
                cursos.map((curso) => (
                  // --- AQUÍ LA CORRECCIÓN ---
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={curso.id}>
                    <CourseCard
                      course={curso}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </Grid>
                  // --- FIN DE LA CORRECCIÓN ---
                ))
              ) : (
                // --- Y AQUÍ TAMBIÉN ---
                <Grid size={12}>
                  {" "}
                  {/* Antes 'item xs={12}' */}
                  <Typography sx={{ textAlign: "center", mt: 4 }}>
                    No se encontraron cursos.
                  </Typography>
                </Grid>
                // --- FIN DE LA CORRECCIÓN ---
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
      {/* <CourseFormDialog 
            open={isModalOpen} 
            onClose={handleCloseModal} 
            courseToEdit={editingCourse}
            onSave={handleSaveCourse}
         /> 
      */}
      {/* <ConfirmationDialog
            open={isDeleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            onConfirm={confirmDelete}
            title="Confirmar Baja de Curso"
            description="¿Estás seguro de que quieres dar de baja este curso?"
            // Add loading state prop if needed
         /> 
      */}
    </Box>
  );
}
