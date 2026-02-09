import { useParams } from "react-router";
import { Box, Typography } from "@mui/material";
import { useOptionalCourseContext } from "../../../context/CourseContext";
import CourseReportsView from "../components/CourseReportsView";

export default function CourseReportsPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const courseContext = useOptionalCourseContext();

  // Prioridad: 1. Curso del Contexto (Docente) -> 2. ID de la URL (Admin/Link)
  const courseId = courseContext?.selectedCourse?.id || paramId;

  if (!courseId)
    return <Typography>Curso no encontrado o no seleccionado.</Typography>;

  return (
    <Box sx={{ mx: -3, mt: -3 }}>
      <CourseReportsView courseId={courseId} />
    </Box>
  );
}
