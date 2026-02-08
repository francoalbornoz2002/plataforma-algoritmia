import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";
import ArchiveIcon from "@mui/icons-material/Archive";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

// Datos del curso a pasar al componente Card
export interface CourseData {
  id: string;
  nombre: string;
  imagenUrl?: string;
  docentes: { nombre: string; apellido: string }[];
  alumnosInscriptos: number;
  createdAt: Date | null;
  deletedAt: Date | null; // Para determinar el estado activo/inactivo
  estadoFinal?: string; // Estado explícito (ej: "Finalizado")
}

interface CourseCardProps {
  course: CourseData;
  onEdit: (course: CourseData) => void;
  onDelete: (id: string) => void;
  onFinalize: (id: string) => void;
}

const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

export default function CourseCard({
  course,
  onEdit,
  onDelete,
  onFinalize,
}: CourseCardProps) {
  const {
    id,
    nombre,
    imagenUrl,
    docentes,
    alumnosInscriptos,
    createdAt,
    deletedAt,
    estadoFinal,
  } = course;

  let estado = deletedAt ? "Inactivo" : "Activo";
  let chipColor: "success" | "error" | "info" =
    estado === "Activo" ? "success" : "error";

  if (estadoFinal === "Finalizado") {
    estado = "Finalizado";
    chipColor = "info";
  }
  // --- Lógica para mostrar docentes ---
  let docentesDisplay: string;
  if (docentes.length === 0) {
    docentesDisplay = "Sin docentes asignados";
  } else if (docentes.length <= 2) {
    // Muestra 1 o 2 docentes
    docentesDisplay = docentes
      .map((d) => `${d.nombre} ${d.apellido}`)
      .join(", ");
  } else {
    // Muestra los primeros 2 y un contador
    const primerosDos = docentes
      .slice(0, 2)
      .map((d) => `${d.nombre} ${d.apellido}`)
      .join(", ");
    const restantes = docentes.length - 2;
    docentesDisplay = `${primerosDos} +${restantes} más`;
  }

  // --- Imagen de fallback ---
  const FOTO_DEFAULT = "https://placehold.co/345x140.png?text=Curso";

  const fullImageUrl = imagenUrl ? `${baseUrl}${imagenUrl}` : FOTO_DEFAULT;

  return (
    <Card
      sx={{
        height: "100%", // Ocupa toda la altura del Grid
        display: "flex",
        flexDirection: "column",
      }}
      variant="outlined"
    >
      <CardMedia
        component="img"
        sx={{ height: 140 }}
        image={fullImageUrl}
        alt={`Imagen del curso ${nombre}`}
      />

      {/* Contenido principal (crece para empujar acciones abajo) */}
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Fila 1: Título y Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1, // Margen inferior
          }}
        >
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            sx={{ mb: 0, lineHeight: 1.2 }} // Ajusta el título
          >
            {nombre}
          </Typography>
          <Chip
            label={estado}
            size="small"
            color={chipColor}
            variant="filled"
            sx={{ ml: 1, flexShrink: 0 }} // Margen izq y evita que se encoja
          />
        </Box>

        {/* Fila 2: Docentes */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 0.5,
            color: "text.secondary",
          }}
        >
          <SchoolIcon sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {docentesDisplay}
          </Typography>
        </Box>

        {/* Fila 3: Alumnos */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "text.secondary",
          }}
        >
          <GroupIcon sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexGrow: 1 }}
          >
            {alumnosInscriptos} Alumnos inscriptos
          </Typography>
        </Box>

        {/* Fila 4: Fecha de creación */}
        {createdAt && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 0.5,
              color: "text.secondary",
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
            <Typography variant="body2" color="text.secondary">
              Creado el {createdAt.toLocaleDateString("es-AR")}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Acciones (se quedan al fondo) */}
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <Tooltip title="Finalizar Curso (Cierre de Ciclo)">
          <span>
            <IconButton
              onClick={() => onFinalize(id)}
              size="small"
              color="warning"
              disabled={!!deletedAt}
            >
              <ArchiveIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Editar Curso">
          <span>
            <IconButton
              onClick={() => onEdit(course)}
              size="small"
              disabled={!!deletedAt}
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Dar de baja Curso">
          <span>
            <IconButton
              onClick={() => onDelete(id)}
              size="small"
              color="error"
              disabled={!!deletedAt}
            >
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
