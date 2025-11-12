import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
  CardActions,
  Tooltip,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
// Íconos para la info
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
// Tipos y Componentes
import type { ClaseConsulta } from "../../../types";
import { estado_clase_consulta } from "../../../types";
import EstadoClaseChip from "../../../components/EstadoClaseChip"; // El chip que acabamos de crear

interface ClaseConsultaCardProps {
  clase: ClaseConsulta;
  onEdit: (clase: ClaseConsulta) => void;
  onDelete: (clase: ClaseConsulta) => void;
  onViewDetails: (clase: ClaseConsulta) => void;
}

export default function ClaseConsultaCard({
  clase,
  onEdit,
  onDelete,
  onViewDetails,
}: ClaseConsultaCardProps) {
  const {
    nombre,
    descripcion,
    fechaClase,
    horaInicio,
    horaFin,
    modalidad,
    estadoClase,
    docenteResponsable,
    consultasEnClase,
    deletedAt,
  } = clase;

  // --- Reglas de Negocio (UI) ---
  // Solo se puede editar/borrar si está "Programada"
  const isProgramada = estadoClase === estado_clase_consulta.Programada;
  // 'deletedAt' es el 'soft delete' (que también la pone en estado 'Cancelada')
  const isCanceled = !!deletedAt;

  // 1. Formateo de Fecha (el "hack" anti-UTC)
  const fechaString = fechaClase.split("T")[0]; // "2025-11-11"
  const [year, month, day] = fechaString.split("-");
  const fecha = `${day}/${month}/${year}`; // "11/11/2025"

  // 2. Formateo de Hora (el "hack" anti-UTC)
  // 'horaInicio' es "1970-01-01T14:00:00.000Z"
  // Le cortamos la parte de la hora "T14:00:00.000Z"
  // y nos quedamos con los primeros 5 chars ("14:00")
  const horaInicioStr = horaInicio.split("T")[1].substring(0, 5); // "14:00"
  const horaFinStr = horaFin.split("T")[1].substring(0, 5); // "15:30"
  const hora = `${horaInicioStr} - ${horaFinStr} hs`;

  const docente = `${docenteResponsable.nombre} ${docenteResponsable.apellido}`;
  const totalConsultas = consultasEnClase.length;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // La hacemos opaca si fue cancelada/borrada
        opacity: isCanceled ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Fila 1: Título y Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" component="div">
            {nombre}
          </Typography>
          <EstadoClaseChip estado={estadoClase} />
        </Box>

        {/* Fila 2: Descripción */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {descripcion}
        </Typography>

        {/* Fila 3: Detalles (Iconos) */}
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <EventIcon fontSize="small" />
            <Typography variant="body2">{fecha}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">{hora}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <PersonIcon fontSize="small" />
            <Typography variant="body2">A cargo de: {docente}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <QuestionAnswerIcon fontSize="small" />
            <Typography variant="body2">
              {totalConsultas} consultas para revisar
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* Fila 4: Acciones */}
      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "space-between", p: 1, px: 2 }}>
        <Chip label={modalidad} size="small" />

        <Button
          size="small"
          onClick={() => onViewDetails(clase)}
          disabled={isCanceled} // Deshabilitado si está cancelada
        >
          Ver consultas a revisar ({totalConsultas})
        </Button>
        {/* Botones (Solo si no está cancelada) */}
        {!isCanceled && (
          <Box>
            <Tooltip title="Editar Clase">
              {/* REGLA: Solo editable si está "Programada" */}
              <span>
                {" "}
                {/* (Span para que el Tooltip funcione en botones deshabilitados) */}
                <IconButton
                  size="small"
                  onClick={() => onEdit(clase)}
                  disabled={!isProgramada}
                >
                  <EditIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancelar Clase (Baja Lógica)">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onDelete(clase)}
                  color="error"
                  disabled={!isProgramada}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </CardActions>
    </Card>
  );
}
