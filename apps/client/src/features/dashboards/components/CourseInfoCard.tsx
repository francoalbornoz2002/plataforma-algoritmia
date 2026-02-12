import { Paper, Stack, Box, Typography, Button } from "@mui/material";
import {
  School,
  CalendarToday,
  Group,
  Description,
  Edit,
} from "@mui/icons-material";

interface CourseInfoCardProps {
  course: any; // Usamos any para flexibilidad entre CursoConDetalles y CursoParaEditar
  studentCount: number;
  isReadOnly?: boolean;
  onEdit?: () => void;
}

export default function CourseInfoCard({
  course,
  studentCount,
  isReadOnly = false,
  onEdit,
}: CourseInfoCardProps) {
  // Helper para obtener nombre del docente según la estructura del objeto
  const getDocenteName = (d: any) => {
    if (d.docente) return `${d.docente.nombre} ${d.docente.apellido}`;
    return `${d.nombre} ${d.apellido}`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        borderTop: "5px solid",
        borderColor: "primary.main",
      }}
    >
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
          {!isReadOnly && onEdit && (
            <Button
              startIcon={<Edit />}
              size="small"
              variant="outlined"
              onClick={onEdit}
            >
              Editar Info
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <School
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Docentes:</strong>{" "}
                {course.docentes?.map(getDocenteName).join(", ") || "Ninguno"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarToday
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Días:</strong>{" "}
                {course.diasClase && course.diasClase.length > 0
                  ? course.diasClase
                      .map(
                        (d: any) => `${d.dia} (${d.horaInicio} - ${d.horaFin})`,
                      )
                      .join(", ")
                  : "Sin definir"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Group fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              <Typography variant="body2">
                <strong>Alumnos:</strong> {studentCount} inscriptos
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "start" }}>
              <Description
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Descripción del curso
                </Typography>
                <Typography variant="body1">{course.descripcion}</Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
