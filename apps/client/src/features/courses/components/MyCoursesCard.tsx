import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
// Importamos los tipos de los servicios
import type { InscripcionConCurso } from "../../users/services/alumnos.service";
import type { AsignacionConCurso } from "../../users/services/docentes.service";
import { Group } from "@mui/icons-material";

// El componente acepta la "inscripción" o "asignación" completa
type MyCourseEntry = InscripcionConCurso | AsignacionConCurso;

// Propiedades para el componente
interface MyCoursesCardProps {
  inscripcion: MyCourseEntry;
  onClick: (inscripcion: MyCourseEntry) => void;
}

// Obtenemos la URL de la API (asegúrate de que VITE_API_URL esté en tu .env)
const API_URL_WITHOUT_PREFIX = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;
const FOTO_DEFAULT = "https://placehold.co/345x140.png?text=Curso";

export default function MyCoursesCard({
  inscripcion,
  onClick,
}: MyCoursesCardProps) {
  // Sacamos el 'estado' del nivel superior y 'curso' del objeto anidado
  const { curso, estado } = inscripcion;
  const { nombre, imagenUrl, docentes, _count, deletedAt } = curso;

  // Lógica de acceso:
  // - Si el curso tiene 'deletedAt', está FINALIZADO -> Es accesible (Solo Lectura).
  // - Si NO está finalizado pero el estado es 'Inactivo' -> El alumno abandonó -> NO accesible.
  const isFinalized = !!deletedAt || estado === "Finalizado";
  const isDroppedOut = estado === "Inactivo" && !isFinalized;
  const isDisabled = isDroppedOut;

  const cantidadAlumnosInscriptos = _count?.alumnos ?? 0;

  // --- LÓGICA PARA MOSTRAR LOS DOCENTES ---
  let docentesDisplay: string;
  if (!docentes || docentes.length === 0) {
    docentesDisplay = "Sin docentes asignados";
  } else if (docentes.length <= 2) {
    docentesDisplay = docentes
      .map((d) => `${d.nombre} ${d.apellido}`)
      .join(", ");
  } else {
    const primerosDos = docentes
      .slice(0, 2)
      .map((d) => `${d.nombre} ${d.apellido}`)
      .join(", ");
    const restantes = docentes.length - 2;
    docentesDisplay = `${primerosDos} +${restantes} más`;
  }

  // Obtenemos la imágen almacenada del curso.
  const fullImageUrl = imagenUrl
    ? `${API_URL_WITHOUT_PREFIX}${imagenUrl}`
    : FOTO_DEFAULT;

  // Configuración del Chip de estado
  const chipLabel = estado;
  let chipColor: "success" | "default" | "info" | "error" = "default";

  if (estado === "Finalizado") {
    chipColor = "info"; // Azul para informativo/histórico
  } else if (estado === "Activo") {
    chipColor = "success";
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: isDisabled ? 0.6 : 1, // Se ve "apagado" si está inactivo
      }}
      variant="outlined"
    >
      <CardActionArea
        disabled={isDisabled}
        onClick={() => onClick(inscripcion)}
        sx={{
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1, // Asegura que la CardActionArea ocupe toda la tarjeta
        }}
      >
        {/* Imagen del curso */}
        <CardMedia
          component="img"
          sx={{ height: 140 }}
          image={fullImageUrl}
          alt={`Imagen del curso ${nombre}`}
        />

        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          {/* Fila 1: Título y Estado */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Typography
              gutterBottom
              variant="h5"
              component="div"
              sx={{ mb: 0, lineHeight: 1.2 }}
            >
              {nombre}
            </Typography>
            <Chip
              label={chipLabel}
              size="small"
              color={chipColor}
              variant="filled"
              sx={{ ml: 1, flexShrink: 0 }}
            />
          </Box>

          {/* Fila 2: Docentes */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2, // Más espacio ya que no hay 'alumnos'
              color: "text.secondary",
            }}
          >
            <SchoolIcon sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {docentesDisplay}
            </Typography>
          </Box>
          {/* Fila 3: Cantidad de alumnos inscriptos */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <Group sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
            <Typography variant="body2" color="text.secondary">
              {cantidadAlumnosInscriptos} Alumnos inscriptos
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
