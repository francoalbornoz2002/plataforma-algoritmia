import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Stack,
  Box,
  Typography,
  Button,
} from "@mui/material";
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

const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;
const FOTO_DEFAULT = "https://placehold.co/345x140.png?text=Curso";

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

  const fullImageUrl = course.imagenUrl
    ? `${baseUrl}${course.imagenUrl}`
    : FOTO_DEFAULT;

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        sx={{ height: 140, objectFit: "cover" }}
        image={fullImageUrl}
        alt={`Imagen del curso ${course.nombre}`}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Información del Curso
        </Typography>
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
                <Typography variant="body2">{course.descripcion}</Typography>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </CardContent>

      {!isReadOnly && onEdit && (
        <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
          <Button
            startIcon={<Edit />}
            size="small"
            variant="outlined"
            onClick={onEdit}
          >
            Editar Info
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
