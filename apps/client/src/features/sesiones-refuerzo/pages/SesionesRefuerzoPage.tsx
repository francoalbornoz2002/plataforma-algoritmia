import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  TextField,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// 1. Hooks, Servicios y Tipos
import { useCourseContext } from "../../../context/CourseContext";
import { findAllSesiones } from "../service/sesiones-refuerzo.service";
import { findActiveAlumnos } from "../../users/services/alumnos.service";

import {
  type SesionRefuerzoResumen,
  type DocenteBasico,
  type DificultadSimple,
  type FindSesionesParams,
  estado_sesion,
  grado_dificultad,
  type PaginatedSesionesResponse,
} from "../../../types";
import { EstadoSesionLabels } from "../../../types/traducciones";

// 2. Componentes Hijos
import SesionCard from "../components/SesionCard";
import DeleteSesionDialog from "../components/DeleteSesionDialog"; // 4. Reemplazo de Dialog
import {
  findActiveDocentes,
  getAllDifficulties,
} from "../../users/services/docentes.service";
import SesionFormModal from "../components/SesionFormModal";

// Mock de componentes que se crearán después
const SesionDetailModal = ({ open }: { open: boolean }) =>
  open ? <div>Detail Modal Placeholder</div> : null;

export default function SesionesRefuerzoPage() {
  const { selectedCourse } = useCourseContext();

  // --- Estados de Datos ---
  const [sesionesData, setSesionesData] =
    useState<PaginatedSesionesResponse | null>(null);

  // --- Estados para Filtros ---
  const [docentesList, setDocentesList] = useState<DocenteBasico[]>([]);
  const [alumnosList, setAlumnosList] = useState<DocenteBasico[]>([]); // Reutilizamos DocenteBasico para alumno
  const [dificultadesList, setDificultadesList] = useState<DificultadSimple[]>(
    []
  );
  const [filters, setFilters] = useState<
    Omit<FindSesionesParams, "page" | "limit" | "sort" | "order">
  >({});
  const [pagination, setPagination] = useState({ page: 1, limit: 9 });

  // --- Estados de Carga/Error ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados de Modales ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [sesionToEdit, setSesionToEdit] =
    useState<SesionRefuerzoResumen | null>(null);
  const [sesionToDelete, setSesionToDelete] =
    useState<SesionRefuerzoResumen | null>(null);
  const [sesionToView, setSesionToView] =
    useState<SesionRefuerzoResumen | null>(null);

  // --- Data Fetching ---

  const fetchFilterData = useCallback(async (idCurso: string) => {
    try {
      const [docentes, alumnos, dificultades] = await Promise.all([
        findActiveDocentes(idCurso),
        findActiveAlumnos(idCurso),
        getAllDifficulties(),
      ]);
      setDocentesList(docentes);
      setAlumnosList(alumnos);
      setDificultadesList(dificultades);
    } catch (err: any) {
      setError("Error al cargar datos para los filtros.");
    }
  }, []);

  const fetchSesiones = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);
    try {
      const params: FindSesionesParams = {
        ...pagination, // 3. Eliminado el debounce
        ...filters,
        sort: "nroSesion",
        order: "desc",
      };
      const data = await findAllSesiones(selectedCourse.id, params);
      setSesionesData(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al cargar las sesiones de refuerzo."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, pagination, filters]);

  useEffect(() => {
    if (selectedCourse) {
      fetchFilterData(selectedCourse.id);
    }
  }, [selectedCourse, fetchFilterData]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  // --- Handlers ---

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset page on filter change
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleOpenCreate = () => {
    setSesionToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (sesion: SesionRefuerzoResumen) => {
    setSesionToEdit(sesion);
    setIsFormModalOpen(true);
  };

  if (!selectedCourse) {
    return <Alert severity="info">Por favor, selecciona un curso.</Alert>;
  }

  return (
    <Box>
      {/* --- 1. Filtros --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            sx={{ width: 120 }}
            label="N° Sesión"
            name="nroSesion"
            size="small"
            type="number"
            onChange={handleFilterChange}
          />
          <FormControl sx={{ width: 200 }} size="small">
            <InputLabel>Alumno</InputLabel>
            <Select
              name="idAlumno"
              label="Alumno"
              value={filters.idAlumno || ""}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {alumnosList.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ width: 200 }} size="small">
            <InputLabel>Docente Creador</InputLabel>
            <Select
              name="idDocente"
              label="Docente Creador"
              value={filters.idDocente || ""}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {docentesList.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre} {d.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ width: 300 }} size="small">
            <InputLabel>Dificultad</InputLabel>
            <Select
              name="idDificultad"
              label="Dificultad"
              value={filters.idDificultad || ""}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todas</MenuItem>
              {dificultadesList.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ width: 100 }} size="small">
            <InputLabel>Grado</InputLabel>
            <Select
              name="gradoSesion"
              label="Grado"
              value={filters.gradoSesion || ""}
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
          <FormControl sx={{ width: 150 }} size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              label="Estado"
              value={filters.estado || ""}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(estado_sesion).map((e) => (
                <MenuItem key={e} value={e}>
                  {EstadoSesionLabels[e]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Crear Sesión
          </Button>
        </Stack>
      </Paper>

      {/* --- 2. Lista de Sesiones (Cards) --- */}
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {sesionesData && sesionesData.data.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {sesionesData.data.map((sesion) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sesion.id}>
                    <SesionCard
                      sesion={sesion}
                      onEdit={handleOpenEdit}
                      onDelete={setSesionToDelete}
                      onViewDetails={setSesionToView}
                    />
                  </Grid>
                ))}
              </Grid>
              <Stack spacing={2} sx={{ mt: 3, alignItems: "center" }}>
                <Pagination
                  count={sesionesData.meta.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Stack>
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron sesiones de refuerzo con los filtros aplicados.
            </Alert>
          )}
        </Box>
      )}

      {/* --- 3. Modales --- */}
      <SesionFormModal
        key={sesionToEdit?.id || "create-sesion"}
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={fetchSesiones}
        sesionToEdit={sesionToEdit}
      />

      {sesionToDelete && (
        <DeleteSesionDialog
          open={!!sesionToDelete}
          onClose={() => setSesionToDelete(null)}
          onDeleteSuccess={fetchSesiones}
          sesionToDelete={sesionToDelete}
        />
      )}

      {/* {sesionToView && (
        <SesionDetailModal
          open={!!sesionToView}
          onClose={() => setSesionToView(null)}
          sesion={sesionToView}
        />
      )} */}
    </Box>
  );
}
