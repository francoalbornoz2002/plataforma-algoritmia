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
  Dialog,
  LinearProgress,
  Divider,
} from "@mui/material";
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
  AssignmentLate,
  Class,
  Delete,
  Event,
  Info,
  MarkUnreadChatAlt,
  School,
  Search,
  SwitchAccessShortcutAdd,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import MissionCard from "../progress/components/MissionCard";
import {
  EstadoConsultaLabels,
  EstadoSesionLabels,
} from "../../types/traducciones";
import InfoAlumno from "./components/InfoAlumno";

// --- Componentes Auxiliares Visuales ---

const DistributionBar = ({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) => {
  const total = items.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Sin datos
      </Typography>
    );

  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: 16,
          borderRadius: 2,
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              width: `${(item.value / total) * 100}%`,
              bgcolor: item.color,
            }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ rowGap: 1 }}
      >
        {items.map((item, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: item.color,
                mr: 1,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight="medium"
            >
              {item.label}: {item.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const ProgressItem = ({
  title,
  percent,
  color,
  valueText,
}: {
  title: string;
  percent: number;
  color:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit";
  valueText: string;
}) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary" fontWeight="medium">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="bold">
        {valueText}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={percent}
      color={color}
      sx={{ height: 8, borderRadius: 4 }}
    />
  </Box>
);

// --- Helpers de Color ---
const getDificultadColor = (label: string) => {
  if (label === "Bajo") return "#4caf50";
  if (label === "Medio") return "#ff9800";
  if (label === "Alto") return "#f44336";
  return "#9e9e9e";
};

const getEstadoSesionColor = (estado: string) => {
  const map: Record<string, string> = {
    Pendiente: "#ff9800",
    Completada: "#4caf50",
    Cancelada: "#f44336",
    En_curso: "#03a9f4",
    Incompleta: "#9c27b0",
    No_realizada: "#9e9e9e",
  };
  return map[estado] || "#9e9e9e";
};

const getEstadoConsultaColor = (estado: string) => {
  const map: Record<string, string> = {
    Pendiente: "#ff9800",
    Resuelta: "#4caf50",
    No_resuelta: "#f44336",
    A_revisar: "#03a9f4",
    Revisada: "#9c27b0",
  };
  return map[estado] || "#9e9e9e";
};

const formatClassTime = (inicio: string, fin: string) => {
  const start = new Date(inicio);
  const end = new Date(fin);
  const dd = String(start.getDate()).padStart(2, "0");
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const yy = String(start.getFullYear()).slice(-2);
  const startHHmm = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endHHmm = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dd}/${mm}/${yy} de ${startHHmm} a ${endHHmm}`;
};

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
  const [studentInfoOpen, setStudentInfoOpen] = useState<any | null>(null);

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
      const studentsData = await getStudentProgressList(selectedCourse.id);
      // Ordenamos alfabéticamente por apellido
      const sortedStudents = studentsData.sort((a, b) =>
        a.apellido.localeCompare(b.apellido),
      );
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);

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
              height: { md: "calc(100vh - 324px)" }, // Altura máxima para permitir scroll sin forzar espacio
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
                              setStudentInfoOpen(student);
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
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Assessment color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold">
                Progreso del Curso
              </Typography>
            </Box>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <Gauge
                  value={stats?.progresoPct ?? 0}
                  height={200}
                  cornerRadius="50%"
                  text={({ value }) => `${value?.toFixed(1)}%`}
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 28,
                      fontWeight: "bold",
                    },
                    [`& .${gaugeClasses.valueArc}`]: { fill: "#4caf50" },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Actividad Reciente
                </Typography>
                <ProgressItem
                  title="Misiones: Hoy vs Semana"
                  percent={
                    stats?.week.misionesCompletadas
                      ? (stats.today.misionesCompletadas /
                          stats.week.misionesCompletadas) *
                        100
                      : 0
                  }
                  color="success"
                  valueText={`${stats?.today.misionesCompletadas ?? 0} / ${stats?.week.misionesCompletadas ?? 0}`}
                />

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Tooltip title="Ver detalles de la misión">
                    <Grid size={{ xs: 6 }}>
                      <DashboardTextCard
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
                        title="Misión más difícil"
                        description="Qué mas intentos lleva (semana)"
                      />
                    </Grid>
                  </Tooltip>
                  <Grid size={{ xs: 6 }}>
                    <DashboardTextCard
                      title="Alumno más activo"
                      description="En la semana actual"
                      value={stats?.week.alumnoMasActivo || "Ninguno"}
                      icon={<School />}
                      color="secondary"
                      small
                    />
                  </Grid>
                </Grid>
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AssignmentLate color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" color="error.main" fontWeight="bold">
                Dificultades Detectadas
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Distribución por Grado
            </Typography>
            <DistributionBar
              items={
                stats?.dificultadesPorGrado?.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: getDificultadColor(d.label),
                })) ?? []
              }
            />

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <DashboardTextCard
                  title="Dificultad más frecuente"
                  description="Detectada esta semana"
                  value={stats?.week.dificultadMasDetectada || "Ninguna"}
                  icon={<Warning />}
                  color="error"
                  small
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DashboardTextCard
                  title="Alumno Crítico"
                  description="Que más dificultades tiene"
                  value={stats?.alumnoMasDificultades || "Ninguno"}
                  icon={<School />}
                  color="warning"
                  small
                />
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SwitchAccessShortcutAdd sx={{ color: "#9c27b0", mr: 1 }} />
              <Typography variant="h6" color="#9c27b0" fontWeight="bold">
                Sesiones de Refuerzo
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Por Estado
            </Typography>
            <DistributionBar
              items={
                stats?.sesionesPorEstado?.map((s) => ({
                  label:
                    EstadoSesionLabels[s.label as estado_sesion] || s.label,
                  value: s.value,
                  color: getEstadoSesionColor(s.label),
                })) ?? []
              }
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Por Origen
            </Typography>
            <DistributionBar
              items={[
                {
                  label: "Generadas por Sistema",
                  value: stats?.sesionesPorOrigen.sistema ?? 0,
                  color: "#9c27b0",
                },
                {
                  label: "Asignadas por Docente",
                  value: stats?.sesionesPorOrigen.docente ?? 0,
                  color: "#ff9800",
                },
              ]}
            />
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
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <MarkUnreadChatAlt color="info" sx={{ mr: 1 }} />
              <Typography variant="h6" color="info.main" fontWeight="bold">
                Consultas y Clases
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Estado de Consultas
            </Typography>
            <DistributionBar
              items={
                stats?.consultasPorEstado?.map((c) => ({
                  label:
                    EstadoConsultaLabels[c.label as estado_consulta] || c.label,
                  value: c.value,
                  color: getEstadoConsultaColor(c.label),
                })) ?? []
              }
            />

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <ProgressItem
                  title="Consultas Hoy vs Sem"
                  percent={
                    stats?.week.consultasRealizadas
                      ? (stats.today.consultasRealizadas /
                          stats.week.consultasRealizadas) *
                        100
                      : 0
                  }
                  color="info"
                  valueText={`${stats?.today.consultasRealizadas ?? 0} / ${stats?.week.consultasRealizadas ?? 0}`}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DashboardTextCard
                  title="Próxima Clase"
                  value={
                    stats?.nextClass
                      ? formatClassTime(
                          stats.nextClass.fechaInicio,
                          stats.nextClass.fechaFin,
                        )
                      : "Sin programar"
                  }
                  description={stats?.nextClass?.modalidad}
                  icon={<Event />}
                  color="primary"
                  small
                />
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
        description="¿Estás seguro de que deseas dar de baja a "
        subject={studentToDelete?.nombre}
        warning="? Esta acción cancelará sus sesiones pendientes y cerrará sus consultas."
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

      {/* MODAL DE INFO DEL ALUMNO */}
      <InfoAlumno
        open={!!studentInfoOpen}
        onClose={() => setStudentInfoOpen(null)}
        student={studentInfoOpen}
      />
    </Stack>
  );
}
