import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
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
import {
  type CourseDashboardData,
  estado_consulta,
  estado_sesion,
} from "../../types";
import { useAuth } from "../authentication/context/AuthProvider";
import {
  Delete,
  Event,
  Info,
  MarkUnreadChatAlt,
  Search,
  SwitchAccessShortcutAdd,
  Warning,
  TaskAlt,
  Assessment,
  AssignmentLate,
} from "@mui/icons-material";
import {
  EstadoConsultaLabels,
  EstadoSesionLabels,
} from "../../types/traducciones";
import InfoAlumno from "./components/InfoAlumno";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "../../components/StatCard";
import { LineChart } from "@mui/x-charts/LineChart";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { PieChart } from "@mui/x-charts/PieChart";
import { FormControl, Select, MenuItem } from "@mui/material";
import { TemasLabels } from "../../types/traducciones";
import { temas } from "../../types";
import CardIcon from "../../components/CardIcon";

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

// --- Helpers de Color ---
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
  const { profile } = useAuth();

  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // Estados de Datos
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<CourseDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentInfoOpen, setStudentInfoOpen] = useState<any | null>(null);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [agruparDificultadesPor, setAgruparDificultadesPor] = useState<
    "dificultad" | "tema" | "grado"
  >("dificultad");

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

  // Paleta de 15 colores bien diferenciados para las dificultades
  const DISTINCT_COLORS = [
    "#d32f2f",
    "#1976d2",
    "#388e3c",
    "#f57c00",
    "#7b1fa2",
    "#0097a7",
    "#c2185b",
    "#5d4037",
    "#afb42b",
    "#0288d1",
    "#689f38",
    "#e64a19",
    "#512da8",
    "#455a64",
    "#fbc02d",
  ];

  const difficultiesPieData =
    stats?.dificultadesGraficos?.porDificultad?.map(
      (item: any, index: number) => ({
        ...item,
        color: DISTINCT_COLORS[index % DISTINCT_COLORS.length],
      }),
    ) || [];

  const temasPieData =
    stats?.dificultadesGraficos?.porTema?.map((item: any) => ({
      ...item,
      label: TemasLabels[item.label as temas] || item.label,
    })) || [];

  const gradosPieData = stats?.dificultadesGraficos?.porGrado || [];

  const activePieData =
    agruparDificultadesPor === "tema"
      ? temasPieData
      : agruparDificultadesPor === "grado"
        ? gradosPieData
        : difficultiesPieData;

  const totalActivo = activePieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Stack spacing={2}>
      {/* HEADER */}
      <DashboardHeader nombre={profile?.nombre} curso={selectedCourse.nombre} />

      {error && <Alert severity="error">{error}</Alert>}

      {/* --- KPIs PRINCIPALES --- */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Progreso"
            value={`${stats?.progresoPct.toFixed(1)}%`}
            icon={<TaskAlt />}
            color="success"
            description="Promedio del curso"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Dificultad Frecuente"
            mode="text"
            value={stats?.dificultadMasDetectada || "Ninguna"}
            icon={<Warning />}
            color="error"
            description="Moda del curso"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Consultas Totales"
            value={stats?.consultas.total ?? 0}
            subValue={`(${stats?.consultas.pendientes ?? 0} pendientes)`}
            icon={<MarkUnreadChatAlt />}
            color="info"
            description="Realizadas por alumnos"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Sesiones Totales"
            value={stats?.sesiones.total ?? 0}
            subValue={`(${stats?.sesiones.pendientes ?? 0} pendientes)`}
            icon={<SwitchAccessShortcutAdd />}
            color="secondary"
            description="Refuerzos generados"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 2 }}>
          <StatCard
            title="Próxima Clase"
            mode="text"
            value={
              stats?.nextClass
                ? formatClassTime(
                    stats.nextClass.fechaInicio,
                    stats.nextClass.fechaFin,
                  )
                : "Sin programar"
            }
            description={
              stats?.nextClass?.modalidad || "No hay clases agendadas"
            }
            icon={<Event />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ height: "100%", mb: 3 }}>
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
              height: "100%",
              maxHeight: 405,
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6" gutterBottom>
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

      {/* --- GRÁFICOS DE PROGRESO Y DIFICULTADES --- */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                gap: 1,
              }}
            >
              <CardIcon icon={<Assessment />} color="success" />
              <Typography variant="h6">Evolución del Progreso</Typography>
            </Box>
            <Box sx={{ width: "100%" }}>
              {stats?.evolucionProgreso &&
              stats.evolucionProgreso.length > 0 ? (
                <LineChart
                  height={400}
                  xAxis={[
                    {
                      data: stats.evolucionProgreso.map((e) =>
                        format(new Date(e.fecha), "dd/MM"),
                      ),
                      scaleType: "point",
                      label: "Fecha",
                    },
                  ]}
                  yAxis={[
                    {
                      label: "Progreso (%)",
                      min: 0,
                      max: 100,
                      tickNumber: 10,
                    },
                  ]}
                  series={[
                    {
                      data: stats.evolucionProgreso.map((e) => e.progreso),
                      label: "Progreso (%)",
                      color: "#4caf50",
                      showMark: true,
                    },
                  ]}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 300,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                  >
                    No hay datos históricos suficientes.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  gap: 1,
                }}
              >
                <CardIcon icon={<AssignmentLate />} color="error" />
                <Typography variant="h6">
                  Distribución de Dificultades
                </Typography>
              </Box>
              <FormControl size="small" variant="standard">
                <Select
                  value={agruparDificultadesPor}
                  onChange={(e) =>
                    setAgruparDificultadesPor(
                      e.target.value as "dificultad" | "tema" | "grado",
                    )
                  }
                  disableUnderline
                  sx={{ fontSize: "0.875rem", fontWeight: "bold" }}
                >
                  <MenuItem value="dificultad">Por Dificultad</MenuItem>
                  <MenuItem value="tema">Por Tema</MenuItem>
                  <MenuItem value="grado">Por Grado</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexGrow: 1,
              }}
            >
              {activePieData.length > 0 && totalActivo > 0 ? (
                <PieChart
                  series={[
                    {
                      data: activePieData,
                      innerRadius: 20,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { fade: "global", highlight: "item" },
                      valueFormatter: (v: any) => {
                        const val = typeof v === "number" ? v : v?.value;
                        const pct =
                          totalActivo > 0
                            ? ((val / totalActivo) * 100).toFixed(1)
                            : "0.0";
                        return `${val} casos (${pct}%)`;
                      },
                    },
                  ]}
                  height={300}
                  slotProps={{
                    legend: {
                      direction: "vertical",
                      position: { vertical: "middle", horizontal: "end" },
                    },
                  }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No hay dificultades registradas.
                </Typography>
              )}
            </Box>
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

      {/* MODAL DE INFO DEL ALUMNO */}
      <InfoAlumno
        open={!!studentInfoOpen}
        onClose={() => setStudentInfoOpen(null)}
        student={studentInfoOpen}
      />
    </Stack>
  );
}
