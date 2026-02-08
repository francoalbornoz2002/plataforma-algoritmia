import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";

import EstadoCursoChip from "../../../components/EstadoCursoChip";
// Importamos los tipos que necesitamos
import type { CursoConDetalles, DocenteCursoConDocente } from "../../../types";

interface JoinCourseCardProps {
  course: CursoConDetalles;
  onJoin: (course: CursoConDetalles) => void;
  isEnrolled: boolean;
}

// Obtenemos la URL de la API (asegúrate de que VITE_API_URL esté en tu .env)
const API_BASE_URL = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;
const FOTO_DEFAULT = "https://placehold.co/345x140.png?text=Curso";

export default function JoinCourseCard({
  course,
  onJoin,
  isEnrolled,
}: JoinCourseCardProps) {
  // Desestructuramos los datos de CursoConDetalles
  const {
    nombre,
    imagenUrl,
    docentes: docentesAnidados, // Renombramos para evitar confusión
    _count,
    deletedAt,
    estado: estadoCurso, // <-- Usamos el estado real del curso
  } = course;

  // 2. Calculamos los alumnos (de la prop '_count')
  const alumnosInscriptos = _count?.alumnos ?? 0;

  // 3. Mapeamos los docentes (de anidado a plano)
  const docentes = docentesAnidados.map(
    (dc: DocenteCursoConDocente) => dc.docente,
  );

  // 4. Calculamos el display de docentes (misma lógica de CourseCard)
  let docentesDisplay: string;
  if (docentes.length === 0) {
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

  // 5. Calculamos la URL de la imagen
  const fullImageUrl = imagenUrl ? `${API_BASE_URL}${imagenUrl}` : FOTO_DEFAULT;

  // 6. Validar si se permite inscripción (Solo si es Activo y no tiene fecha de baja)
  const isJoinable = estadoCurso === "Activo" && !deletedAt;

  return (
    <Card
      sx={{
        height: "100%",
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

      {/* Contenido (Copiado de CourseCard) */}
      <CardContent sx={{ flexGrow: 1 }}>
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
          <EstadoCursoChip
            estado={estadoCurso}
            deletedAt={deletedAt}
            small
            sx={{ ml: 1, flexShrink: 0 }}
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
          <Typography variant="body2" color="text.secondary">
            {alumnosInscriptos} Alumnos inscriptos
          </Typography>
        </Box>
      </CardContent>

      {/* --- REEMPLAZO DE 'CardActions' --- */}
      <Divider />
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant={isEnrolled ? "outlined" : "contained"} // Cambia el estilo
          onClick={() => onJoin(course)}
          disabled={isEnrolled || !isJoinable} // <-- Bloqueo si no es inscribible
        >
          {isEnrolled
            ? "Ya estás inscripto"
            : !isJoinable
              ? estadoCurso === "Finalizado"
                ? "Curso Finalizado"
                : "No disponible"
              : "Inscribirse"}
        </Button>
      </Box>
      {/* --- FIN DEL REEMPLAZO --- */}
    </Card>
  );
}
