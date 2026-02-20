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
  Divider,
  Dialog,
} from "@mui/material";
import DashboardStatCard from "./components/DashboardStatCard";
import DashboardTextCard from "./components/DashboardTextCard";
import CourseInfoCard from "./components/CourseInfoCard";

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
import {
  type CourseDashboardData,
  type Mision,
  estado_consulta,
  estado_sesion,
} from "../../types";
import { useAuth } from "../authentication/context/AuthProvider";
import {
  Assessment,
  Class,
  Delete,
  Event,
  Info,
  MarkUnreadChatAlt,
  School,
  Search,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";
import MissionCard from "../progress/components/MissionCard";
import {
  EstadoConsultaLabels,
  EstadoSesionLabels,
} from "../../types/traducciones";

export default function DocenteDashboardPage() {
  const { selectedCourse, isReadOnly, refreshCourse } = useCourseContext();
  const { profile } = useAuth(); // <-- Usamos 'profile' que tiene el nombre completo
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // Estados de Datos
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<CourseDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mision | null>(null);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
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

  return (
    <Stack spacing={3}>
      {/* HEADER */}
      <Paper
        elevation={2}
        sx={{ p: 2, borderLeft: "5px solid", borderColor: "primary.main" }}
      >
        <Stack spacing={1}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            ¡Hola, {profile?.nombre}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bienvenido al panel de control de:{" "}
            <strong>{selectedCourse.nombre}</strong>. Estas son algunas acciones
            rápidas que puedes realizar:
          </Typography>
        </Stack>
      </Paper>
      {/* ACCIONES RÁPIDAS */}
      <Stack spacing={3} direction="row">
        <Button
          fullWidth
          variant="outlined"
          color="success"
          startIcon={<TrendingUp />}
          onClick={() => navigate("/course/progress")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver Progreso
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Warning />}
          onClick={() => navigate("/course/difficulties")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver Dificultades
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="info"
          startIcon={<MarkUnreadChatAlt />}
          onClick={() => navigate("/course/consults")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver Consultas
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Class />}
          onClick={() => navigate("/course/sessions")}
          sx={{
            justifyContent: "flex-start",
            bgcolor: "background.paper",
            borderColor: "#9c27b0",
            color: "#9c27b0",
          }}
        >
          Asignar Sesión
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<Event />}
          onClick={() => navigate("/course/consult-classes")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Agendar Clase
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="warning"
          startIcon={<Assessment />}
          onClick={() => navigate("/course/reports")}
          sx={{ justifyContent: "flex-start", bgcolor: "background.paper" }}
        >
          Ver Reportes
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3} sx={{ height: "100%" }}>
        {/* 1. INFO DEL CURSO */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          <CourseInfoCard
            course={selectedCourse}
            studentCount={students.length}
            isReadOnly={isReadOnly}
            onEdit={() => setIsEditModalOpen(true)}
          />
        </Grid>
        {/* --- 2 SIDEBAR ALUMNOS --- */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          {/* LISTA DE ALUMNOS */}
          <Paper
            elevation={3}
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderTop: 5,
              borderColor: "primary.main",
              maxHeight: { md: "calc(100vh - 324px)" }, // Altura máxima para permitir scroll sin forzar espacio
              top: { md: 16 },
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Alumnos inscriptos
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
                      <Search fontSize="small" />
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
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Ver información">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              // Aquí podrías abrir un modal rápido con info del alumno
                              // O navegar a su detalle
                              console.log("Ver info de", student.nombre);
                            }}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!isReadOnly && (
                          <Tooltip title="Dar de baja">
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              onClick={() => handleRemoveClick(student)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={
                          student.fotoPerfilUrl
                            ? `${baseUrl}${student.fotoPerfilUrl}`
                            : undefined
                        }
                        sx={{ width: 32, height: 32, border: 1 }}
                      >
                        {student.apellido[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${student.apellido}, ${student.nombre}`}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: "medium",
                      }}
                      sx={{ ml: -1.5 }}
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
      <Grid container spacing={3}>
        {/* GRUPO: PROGRESO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "success.main",
              height: "100%",
            }}
          >
            <Typography variant="h6" gutterBottom color="success.main">
              Progreso del Curso
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <Gauge
                  value={stats?.progresoPct ?? 0}
                  height={200}
                  text={({ value }) => `${value?.toFixed(0)}%`}
                  sx={{
                    [`& .${gaugeClasses.valueArc}`]: { fill: "#4caf50" },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Stack spacing={1}>
                  <DashboardStatCard
                    title="Misiones"
                    value={`${stats?.today.misionesCompletadas ?? 0} / ${stats?.week.misionesCompletadas ?? 0}`}
                    subtitle="Hoy vs Semana"
                    icon={<TrendingUp />}
                    color="success"
                    small
                  />
                  <Tooltip title="Ver detalles de la misión">
                    <Box>
                      <DashboardTextCard
                        title="Misión más difícil"
                        value={
                          stats?.week.misionMasDificil
                            ? `Misión N° ${stats.week.misionMasDificil.numero}`
                            : "Ninguna"
                        }
                        icon={<Warning />}
                        color="warning"
                        small
                        onClick={() =>
                          stats?.week.misionMasDificil &&
                          setSelectedMission(stats.week.misionMasDificil)
                        }
                      />
                    </Box>
                  </Tooltip>
                  <DashboardTextCard
                    title="Alumno más activo"
                    value={stats?.week.alumnoMasActivo || "Ninguno"}
                    icon={<School />}
                    color="secondary"
                    small
                  />
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* GRUPO: DIFICULTADES */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "error.main",
              height: "100%",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            <Typography variant="h6" gutterBottom color="error.main">
              Dificultades Detectadas
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <PieChart
                  series={[
                    {
                      data:
                        stats?.dificultadesPorGrado?.map((d) => ({
                          ...d,
                          color:
                            d.label === "Bajo"
                              ? "#4caf50"
                              : d.label === "Medio"
                                ? "#ff9800"
                                : d.label === "Alto"
                                  ? "#f44336"
                                  : "#9e9e9e",
                        })) ?? [],
                      innerRadius: 30,
                    },
                  ]}
                  height={200}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Stack spacing={1}>
                  <DashboardTextCard
                    title="Frecuente"
                    value={stats?.week.dificultadMasDetectada || "Ninguna"}
                    icon={<Warning />}
                    color="error"
                    small
                  />
                  <DashboardTextCard
                    title="Alumno con más dificultades"
                    value={stats?.alumnoMasDificultades || "Ninguno"}
                    icon={<School />}
                    color="warning"
                    small
                  />
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {/* GRUPO: SESIONES DE REFUERZO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "#9c27b0",
              height: "100%",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            <Typography variant="h6" gutterBottom color="#9c27b0">
              Sesiones de Refuerzo
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" align="center" display="block">
                  Por Estado
                </Typography>
                <PieChart
                  series={[
                    {
                      data:
                        stats?.sesionesPorEstado?.map((s) => ({
                          ...s,
                          label:
                            EstadoSesionLabels[s.label as estado_sesion] ||
                            s.label,
                        })) ?? [],
                    },
                  ]}
                  height={170}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" align="center" display="block">
                  Por Origen
                </Typography>
                <PieChart
                  series={[
                    {
                      data: [
                        {
                          label: "Sistema",
                          value: stats?.sesionesPorOrigen.sistema ?? 0,
                          color: "#9c27b0",
                        },
                        {
                          label: "Docente",
                          value: stats?.sesionesPorOrigen.docente ?? 0,
                          color: "#ff9800",
                        },
                      ],
                    },
                  ]}
                  height={170}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* GRUPO: CONSULTAS */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderTop: "4px solid",
              borderColor: "info.main",
              height: "100%",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            <Typography variant="h6" gutterBottom color="info.main">
              Consultas y Clases
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <PieChart
                  series={[
                    {
                      data:
                        stats?.consultasPorEstado?.map((c) => ({
                          ...c,
                          label:
                            EstadoConsultaLabels[c.label as estado_consulta] ||
                            c.label,
                        })) ?? [],
                      innerRadius: 30,
                      paddingAngle: 2,
                    },
                  ]}
                  height={200}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <Stack spacing={1}>
                  <DashboardStatCard
                    title="Consultas"
                    value={`${stats?.today.consultasRealizadas ?? 0} / ${stats?.week.consultasRealizadas ?? 0}`}
                    subtitle="Hoy vs Semana"
                    icon={<MarkUnreadChatAlt />}
                    color="info"
                    small
                  />
                  <DashboardTextCard
                    title="Próxima Clase"
                    value={
                      stats?.nextClass
                        ? new Date(
                            stats.nextClass.fechaInicio,
                          ).toLocaleDateString()
                        : "Sin programar"
                    }
                    description={stats?.nextClass?.modalidad}
                    icon={<Event />}
                    color="primary"
                    small
                  />
                </Stack>
              </Grid>
            </Grid>
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

      {/* MODAL DETALLE DE MISIÓN */}
      <Dialog
        open={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 1 }}>
          {selectedMission && (
            <MissionCard
              missionData={{ mision: selectedMission, completada: null }}
              hideStatus
            />
          )}
        </Box>
      </Dialog>
    </Stack>
  );
}
