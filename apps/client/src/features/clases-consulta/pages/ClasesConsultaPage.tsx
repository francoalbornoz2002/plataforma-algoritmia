import { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// 1. Hooks, Servicios y Tipos
import { useCourseContext } from "../../../context/CourseContext";
import {
  findActiveDocentes,
  findPendingConsultas,
} from "../../users/services/docentes.service";
import { findAllClasesByCurso } from "../services/clases-consulta.service";
import {
  type ClaseConsulta,
  type DocenteBasico,
  type ConsultaSimple,
  estado_clase_consulta,
} from "../../../types";

// 2. Componentes Hijos
import ClaseConsultaCard from "../components/ClaseConsultaCard";
import ClaseConsultaFormModal from "../components/ClaseConsultaFormModal";
import DeleteClaseDialog from "../components/DeleteClaseDialog";

// Tipos para los filtros
type OrdenFiltro =
  | "fecha-desc"
  | "fecha-asc"
  | "consultas-desc"
  | "consultas-asc";

export default function ClasesConsultaPage() {
  const { selectedCourse } = useCourseContext();

  // --- Estados de Datos (Precarga) ---
  const [allClases, setAllClases] = useState<ClaseConsulta[]>([]);
  const [docentesList, setDocentesList] = useState<DocenteBasico[]>([]);
  const [consultasList, setConsultasList] = useState<ConsultaSimple[]>([]);

  // --- Estados de Carga/Error ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados de Filtros y Orden ---
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [docenteFiltro, setDocenteFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [orden, setOrden] = useState<OrdenFiltro>("fecha-desc");

  // --- Estados de Modales ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claseToEdit, setClaseToEdit] = useState<ClaseConsulta | null>(null);
  const [claseToDelete, setClaseToDelete] = useState<ClaseConsulta | null>(
    null
  );

  // --- Data Fetching (Cliente) ---
  const fetchData = () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);

    // 1. Pedimos los 3 sets de datos en paralelo
    Promise.all([
      findAllClasesByCurso(selectedCourse.id),
      findActiveDocentes(selectedCourse.id),
      findPendingConsultas(selectedCourse.id),
    ])
      .then(([clasesData, docentesData, consultasData]) => {
        setAllClases(clasesData);
        setDocentesList(docentesData);
        setConsultasList(consultasData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourse]);

  // --- Lógica de Filtros y Orden (Cliente) ---
  const clasesFiltradasYOrdenadas = useMemo(() => {
    let clases = [...allClases];

    // 1. Filtrar
    if (docenteFiltro !== "Todos") {
      clases = clases.filter((c) => c.idDocente === docenteFiltro);
    }
    if (estadoFiltro !== "Todos") {
      clases = clases.filter((c) => c.estadoClase === estadoFiltro);
    }
    if (fechaDesde) {
      clases = clases.filter((c) => new Date(c.fechaClase) >= fechaDesde);
    }
    if (fechaHasta) {
      clases = clases.filter((c) => new Date(c.fechaClase) <= fechaHasta);
    }

    // 2. Ordenar
    switch (orden) {
      case "fecha-asc":
        clases.sort(
          (a, b) =>
            new Date(a.fechaClase).getTime() - new Date(b.fechaClase).getTime()
        );
        break;
      case "consultas-desc":
        clases.sort(
          (a, b) => b.consultasEnClase.length - a.consultasEnClase.length
        );
        break;
      case "consultas-asc":
        clases.sort(
          (a, b) => a.consultasEnClase.length - b.consultasEnClase.length
        );
        break;
      case "fecha-desc":
      default:
        clases.sort(
          (a, b) =>
            new Date(b.fechaClase).getTime() - new Date(a.fechaClase).getTime()
        );
    }

    return clases;
  }, [allClases, docenteFiltro, estadoFiltro, fechaDesde, fechaHasta, orden]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setClaseToEdit(null); // Asegurarse de que esté en modo "Crear"
    setIsModalOpen(true);
  };

  const handleOpenEdit = (clase: ClaseConsulta) => {
    setClaseToEdit(clase); // Pone el objeto en modo "Editar"
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchData(); // Refresca toda la data
  };

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú.
      </Alert>
    );
  }

  return (
    <Box>
      {/* --- 1. Filtros y Orden --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack direction="row" spacing={2}>
          <DatePicker
            label="Fecha Desde"
            value={fechaDesde}
            onChange={setFechaDesde}
            slotProps={{ textField: { size: "small" } }}
            sx={{ minWidth: 175, maxWidth: 175 }}
          />

          <DatePicker
            label="Fecha Hasta"
            value={fechaHasta}
            onChange={setFechaHasta}
            slotProps={{ textField: { size: "small" } }}
            sx={{ minWidth: 175, maxWidth: 175 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Docente</InputLabel>
            <Select
              value={docenteFiltro}
              label="Docente"
              onChange={(e) => setDocenteFiltro(e.target.value)}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              {docentesList.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre} {d.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={orden}
              label="Ordenar por"
              onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
            >
              <MenuItem value="fecha-desc">Más Recientes</MenuItem>
              <MenuItem value="fecha-asc">Más Antiguas</MenuItem>
              <MenuItem value="consultas-desc">
                Cant. Consultas (Mayor)
              </MenuItem>
              <MenuItem value="consultas-asc">Cant. Consultas (Menor)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={estadoFiltro}
              label="Estado"
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              {Object.values(estado_clase_consulta).map((e) => (
                <MenuItem key={e} value={e}>
                  {e.replace("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row">
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Crear Clase
          </Button>
        </Stack>
      </Paper>

      {/* --- 2. Lista de Clases (Cards) --- */}
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {clasesFiltradasYOrdenadas.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron clases de consulta con esos filtros.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {clasesFiltradasYOrdenadas.map((clase) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={clase.id}>
                  <ClaseConsultaCard
                    clase={clase}
                    onEdit={handleOpenEdit}
                    onDelete={setClaseToDelete}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* --- 3. Modales --- */}
      {/* (El modal de Crear/Editar se renderiza solo cuando 'isModalOpen' es true) */}
      <ClaseConsultaFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        claseToEdit={claseToEdit}
        docentesList={docentesList}
        consultasList={consultasList}
      />

      {claseToDelete && (
        <DeleteClaseDialog
          open={!!claseToDelete}
          onClose={() => setClaseToDelete(null)}
          onDeleteSuccess={handleSaveSuccess}
          clase={claseToDelete}
        />
      )}
    </Box>
  );
}
