import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Button,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import EventIcon from "@mui/icons-material/Event";
import ClassIcon from "@mui/icons-material/Class";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";

import { useCourseContext } from "../../context/CourseContext";

import {
  getStudentProgressList,
  removeStudentFromCourse,
  getCourseDashboardStats,
} from "../users/services/docentes.service";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import CourseFormDialog from "../courses/components/CourseFormDialog";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router";
import type { CourseDashboardData } from "../../types";
import { useAuth } from "../authentication/context/AuthProvider";

export default function DocenteDashboardPage() {
  const { selectedCourse, isReadOnly, refreshCourse } = useCourseContext();
  const { profile } = useAuth(); // <-- Usamos 'profile' que tiene el nombre completo
  const navigate = useNavigate();

  // Estados de Datos
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<CourseDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0); // 0: Semana, 1: Hoy
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estado para eliminar alumno
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchAllData = async () => {
    if (!selectedCourse) return;
    setLoadingStudents(true);
    setError(null);
    try {
      // 1. Cargar Alumnos (Traemos todos para filtrar en cliente en el sidebar)
      const studentsRes = await getStudentProgressList(selectedCourse.id, {
        page: 1,
        limit: 100,
        sort: "apellido",
        order: "asc",
      });
      setStudents(studentsRes.data);
      setFilteredStudents(studentsRes.data);

      // 2. Cargar Estadísticas
      const statsRes = await getCourseDashboardStats(selectedCourse.id);
      setStats(statsRes);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar datos del dashboard.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  // --- FILTRO DE ALUMNOS ---
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.nombre.toLowerCase().includes(lower) ||
            s.apellido.toLowerCase().includes(lower),
        ),
      );
    }
  }, [searchTerm, students]);

  // --- HANDLERS ---
  const handleRemoveClick = (student: any) => {
    setStudentToDelete({
      id: student.idAlumno,
      nombre: `${student.nombre} ${student.apellido}`,
    });
  };

  const confirmRemove = async () => {
    if (!selectedCourse || !studentToDelete) return;
    setIsDeleting(true);
    try {
      await removeStudentFromCourse(selectedCourse.id, studentToDelete.id);
      enqueueSnackbar("Alumno dado de baja correctamente", {
        variant: "success",
      });
      setStudentToDelete(null);
      fetchAllData(); // Recargar todo
    } catch (err: any) {
      enqueueSnackbar(err.message || "Error al dar de baja", {
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditCourseSave = () => {
    setIsEditModalOpen(false);
    refreshCourse(); // Recargar contexto del curso
    enqueueSnackbar("Información del curso actualizada", {
      variant: "success",
    });
  };

  if (!selectedCourse) {
    return (
      <Alert severity="info">Selecciona un curso para ver el panel.</Alert>
    );
  }

  // Preparar datos para mostrar según el Tab seleccionado
  const currentStats = tabValue === 0 ? stats?.week : stats?.today;

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      {/* HEADER */}
      <Box>
        <Typography variant="h4" gutterBottom>
          ¡Hola, {profile?.nombre}! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido al panel de control de:{" "}
          <strong>{selectedCourse.nombre}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {/* --- COLUMNA IZQUIERDA (Principal) --- */}
        <Grid size={{ xs: 12, md: 9 }} sx={{ height: "100%" }}>
          <Stack spacing={2}>
            {/* 1. SECCIÓN SUPERIOR: INFO + ACCIONES */}
            <Grid container spacing={2}>
              {/* A. INFORMACIÓN DEL CURSO (75% del ancho disponible) */}
              <Grid size={{ xs: 12, md: 9 }}>
                <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="primary">
                        Información del Curso
                      </Typography>
                      {!isReadOnly && (
                        <Button
                          startIcon={<EditIcon />}
                          size="small"
                          variant="outlined"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          Editar Info
                        </Button>
                      )}
                    </Box>

                    <Stack spacing={2}>
                      {/* Descripción */}

                      {/* Detalles */}
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <SchoolIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            <strong>Docentes:</strong>{" "}
                            {selectedCourse.docentes
                              .map((d) => `${d.nombre} ${d.apellido}`)
                              .join(", ")}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CalendarTodayIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            <strong>Días:</strong>{" "}
                            {selectedCourse.diasClase
                              .map((d) => d.dia)
                              .join(", ") || "Sin definir"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <GroupIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            <strong>Alumnos:</strong> {students.length}{" "}
                            inscriptos
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "start" }}>
                          <DescriptionIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "text.secondary" }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              Descripción del curso
                            </Typography>
                            <Typography variant="body1">
                              {selectedCourse.descripcion}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

              {/* B. ACCIONES RÁPIDAS (25% del ancho disponible) */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Acciones rápidas
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUpIcon />}
                      onClick={() => navigate("/course/progress")}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Ver Progreso
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<WarningIcon />}
                      onClick={() => navigate("/course/difficulties")}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Ver Dificultades
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EventIcon />}
                      onClick={() => navigate("/course/consults")}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Agendar Clase
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ClassIcon />}
                      onClick={() => navigate("/course/sessions")}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Crear Sesión
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AssessmentIcon />}
                      onClick={() => navigate("/course/reports")}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Ver Reportes
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* 2. SECCIÓN DE ESTADÍSTICAS */}
            <Paper elevation={2}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, v) => setTabValue(v)}
                  aria-label="estadisticas tabs"
                >
                  <Tab label="Resumen de la Semana" />
                  <Tab label="Datos de Hoy" />
                </Tabs>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardStatCard
                      title="Misiones Completadas"
                      value={currentStats?.misionesCompletadas ?? "-"}
                      icon={<TrendingUpIcon />}
                      color="success"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardStatCard
                      title="Consultas Realizadas"
                      value={currentStats?.consultasRealizadas ?? "-"}
                      icon={<PersonIcon />}
                      color="info"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardTextCard
                      title="Misión más difícil"
                      value={currentStats?.misionMasDificil || "Ninguna"}
                      icon={<WarningIcon />}
                      color="warning"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardTextCard
                      title="Dificultad frecuente"
                      value={currentStats?.dificultadMasDetectada || "Ninguna"}
                      icon={<WarningIcon />}
                      color="error"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardTextCard
                      title="Alumno más activo"
                      value={currentStats?.alumnoMasActivo || "Ninguno"}
                      icon={<SchoolIcon />}
                      color="primary"
                    />
                  </Grid>
                  {/* Solo mostramos próxima clase en la pestaña semanal */}
                  {tabValue === 0 && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <DashboardTextCard
                        title="Próxima Clase"
                        value={
                          stats?.nextClass
                            ? new Date(
                                stats.nextClass.fechaClase,
                              ).toLocaleDateString()
                            : "No hay"
                        }
                        icon={<EventIcon />}
                        color="secondary"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Stack>
        </Grid>

        {/* --- COLUMNA DERECHA (Sidebar Alumnos) --- */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ height: "100%" }}>
          <Paper
            elevation={3}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6" gutterBottom>
                Alumnos
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <ListItem
                    key={student.idAlumno}
                    divider
                    secondaryAction={
                      !isReadOnly && (
                        <Tooltip title="Dar de baja">
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveClick(student)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {student.nombre[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${student.apellido}, ${student.nombre}`}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: "medium",
                      }}
                      secondary={
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            cursor: "pointer",
                            color: "primary.main",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => {
                            // Aquí podrías abrir un modal rápido con info del alumno
                            // O navegar a su detalle
                            console.log("Ver info de", student.nombre);
                          }}
                        >
                          Ver info
                        </Typography>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron alumnos.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      {/* --- MODALES --- */}
      <CourseFormDialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditCourseSave}
        courseToEditId={selectedCourse.id}
        isTeacherMode={true} // <-- Activamos modo docente
      />

      <ConfirmationDialog
        open={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={confirmRemove}
        title="Dar de baja alumno"
        description={`¿Estás seguro de que deseas dar de baja a ${studentToDelete?.nombre}? Esta acción cancelará sus sesiones pendientes y cerrará sus consultas.`}
        isLoading={isDeleting}
        confirmText="Dar de baja"
      />
    </Stack>
  );
}
