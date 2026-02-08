import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";

// 1. Contexto y Tipos
import { useCourseContext } from "../../../context/CourseContext";
import {
  roles,
  type CursoParaEditar,
  type CursoConDetalles,
  estado_simple,
} from "../../../types";

// 2. Servicios
import {
  findMyCourses as findMyStudentCourses,
  type InscripcionConCurso,
} from "../../users/services/alumnos.service";
import {
  findMyCourses as findMyTeacherCourses,
  type AsignacionConCurso,
} from "../../users/services/docentes.service";

// 3. Componentes Hijos
import MyCoursesCard from "./MyCoursesCard"; // <-- Tarjeta para "Mis Cursos"
import JoinCourseCard from "./JoinCourseCard"; // <-- Tarjeta para "Inscribirse"
import JoinCourseModal from "./JoinCourseModal"; // <-- Modal de Contraseña
import {
  findCourses,
  type PaginatedCoursesResponse,
} from "../services/courses.service";

interface CourseSelectionModalProps {
  open: boolean;
  onClose: () => void;
  role: roles;
}

// Tipo unificado para las listas de cursos
type MyCourseEntry = InscripcionConCurso | AsignacionConCurso;

export default function CourseSelectionModal({
  open,
  onClose,
  role,
}: CourseSelectionModalProps) {
  const { setSelectedCourse } = useCourseContext();
  const [tabValue, setTabValue] = useState(0);

  // --- Estados para la Pestaña "Mis Cursos" ---
  const [myCourses, setMyCourses] = useState<MyCourseEntry[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(true);
  const [myCoursesError, setMyCoursesError] = useState<string | null>(null);

  // --- Estados para la Pestaña "Inscribirse" ---
  const [allCourses, setAllCourses] = useState<CursoConDetalles[]>([]);
  const [allCoursesLoading, setAllCoursesLoading] = useState(true);
  const [allCoursesError, setAllCoursesError] = useState<string | null>(null);

  // --- Estado para el modal de "Unirse" ---
  const [joiningCourse, setJoiningCourse] = useState<CursoConDetalles | null>(
    null,
  );

  const isStudent = role === roles.Alumno;

  // Función memoizada para cargar "Mis Cursos"
  const fetchMyData = useMemo(() => {
    return isStudent ? findMyStudentCourses : findMyTeacherCourses;
  }, [isStudent]);

  // Creamos un Set con los IDs de los cursos en los que el alumno
  // ya está inscripto (activa o inactivamente).
  const enrolledCourseIds = useMemo(() => {
    // Extraemos el idCurso (que está dentro de 'curso.id')
    const ids = myCourses.map((entry) => entry.curso.id);
    // Creamos un Set para búsquedas instantáneas (O(1))
    return new Set(ids);
  }, [myCourses]); // Se recalcula solo si 'myCourses' cambia

  // Verificamos si el alumno ya está inscripto en CUALQUIER curso.
  const isEnrolledInAnyCourse = useMemo(() => {
    if (!isStudent) return false;
    // Si la lista de "Mis Cursos" tiene al menos un elemento, está inscripto.
    return myCourses.length > 0;
  }, [myCourses, isStudent]);

  // --- EFECTO: Cargar datos al abrir el modal ---
  useEffect(() => {
    if (open) {
      // 1. Cargar "Mis Cursos"
      setMyCoursesLoading(true);
      setMyCoursesError(null);
      // Reseteamos al tab 0 por defecto mientras carga
      setTabValue(0);

      fetchMyData()
        .then((data) => {
          const courses = data as MyCourseEntry[];
          setMyCourses(courses);
          // Si es alumno y no tiene cursos, lo mandamos a inscribirse
          if (isStudent && courses.length === 0) {
            setTabValue(1);
          }
        })
        .catch((err) => setMyCoursesError(err.message))
        .finally(() => setMyCoursesLoading(false));

      // 2. Cargar "Todos los Cursos" (solo si es alumno)
      if (isStudent) {
        setAllCoursesLoading(true);
        setAllCoursesError(null);
        findCourses({
          page: 1,
          limit: 50,
          sort: "nombre",
          order: "asc",
          estado: estado_simple.Activo,
        })
          .then((response: PaginatedCoursesResponse) =>
            setAllCourses(response.data),
          )
          .catch((err) => setAllCoursesError(err.message))
          .finally(() => setAllCoursesLoading(false));
      }
    } else {
      // Al cerrar, reseteamos el tab para la próxima vez que se abra
      setTabValue(0);
    }
  }, [open, isStudent, fetchMyData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Si se intenta cambiar a la pestaña "Inscribirse" (índice 1) y el alumno ya está inscripto,
    // no hacemos nada para prevenir la navegación.
    if (newValue === 1 && isEnrolledInAnyCourse) {
      return;
    }
    setTabValue(newValue);
  };

  // --- Handlers ---
  const handleSelectCourse = (inscripcion: MyCourseEntry) => {
    // Permitimos entrar si está Activo O si el curso está Finalizado (Historial)
    const isFinalized = !!inscripcion.curso.deletedAt;
    const isActive = inscripcion.estado === "Activo";

    if (!isActive && !isFinalized) return; // Bloqueado solo si abandonó un curso activo

    setSelectedCourse(inscripcion.curso as CursoParaEditar);
    onClose();
  };

  const handleJoinSuccess = () => {
    setJoiningCourse(null); // Cierra el modal de contraseña
    setTabValue(0); // Mueve al usuario a la pestaña "Mis Cursos"

    // Forzamos un refetch de "Mis Cursos"
    setMyCoursesLoading(true);
    fetchMyData()
      .then((data) => setMyCourses(data as MyCourseEntry[]))
      .catch((err) => setMyCoursesError(err.message))
      .finally(() => setMyCoursesLoading(false));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            onClose();
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
      >
        <DialogTitle align="center">Selecciona un Curso</DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Mis Cursos" />
            {isStudent && (
              <Tooltip
                title={
                  isEnrolledInAnyCourse
                    ? "Ya estás inscripto en un curso. Solo puedes tener una inscripción a la vez."
                    : ""
                }
              >
                <Tab
                  label="Inscribirse a un Curso"
                  sx={{
                    cursor: isEnrolledInAnyCourse ? "not-allowed" : "pointer",
                    opacity: isEnrolledInAnyCourse ? 0.6 : 1,
                  }}
                />
              </Tooltip>
            )}
          </Tabs>
        </Box>

        {/* --- Pestaña 0: "Mis Cursos" --- */}
        {tabValue === 0 && (
          <DialogContent sx={{ minHeight: "400px", bgcolor: "#f9f9f9" }}>
            {myCoursesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : myCoursesError ? (
              <Alert severity="error">{myCoursesError}</Alert>
            ) : myCourses.length === 0 ? (
              <Typography sx={{ textAlign: "center", mt: 2 }}>
                {isStudent
                  ? 'No estás inscripto en ningún curso. Revisa la pestaña "Inscribirse".'
                  : "No tienes cursos asignados."}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {myCourses.map((inscripcion) => (
                  <Grid
                    size={{ xs: 12, sm: 6, md: 4 }}
                    key={inscripcion.curso.id}
                  >
                    <MyCoursesCard
                      inscripcion={inscripcion}
                      onClick={handleSelectCourse}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
        )}

        {/* --- Pestaña 1: "Inscribirse a un Curso" (Solo Alumno) --- */}
        {tabValue === 1 && isStudent && (
          <DialogContent sx={{ minHeight: "400px", bgcolor: "#f9f9f9" }}>
            {allCoursesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : allCoursesError ? (
              <Alert severity="error">{allCoursesError}</Alert>
            ) : (
              <Grid container spacing={2}>
                {allCourses.map((curso) => {
                  const isEnrolled = enrolledCourseIds.has(curso.id);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={curso.id}>
                      <JoinCourseCard
                        course={curso}
                        onJoin={setJoiningCourse}
                        isEnrolled={isEnrolled}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* --- El Modal "Chiquito" (de Contraseña) --- */}
      {joiningCourse && (
        <JoinCourseModal
          open={!!joiningCourse}
          onClose={() => setJoiningCourse(null)}
          course={joiningCourse}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </>
  );
}
