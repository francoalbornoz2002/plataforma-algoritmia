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
} from "@mui/material";
// Íconos para la info
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
// Helpers de fecha
import { format } from "date-fns";
import { es } from "date-fns/locale";
// Tipos y Componentes
import type { ClaseConsulta } from "../../../types";
import { estado_clase_consulta } from "../../../types";
import EstadoClaseChip from "../../../components/EstadoClaseChip"; // El chip que acabamos de crear

interface ClaseConsultaCardProps {
  clase: ClaseConsulta;
  onEdit: (clase: ClaseConsulta) => void;
  onDelete: (clase: ClaseConsulta) => void;
}

export default function ClaseConsultaCard({
  clase,
  onEdit,
  onDelete,
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

  // --- Formateo de Datos ---
  const fecha = format(new Date(fechaClase), "EEEE dd 'de' MMMM, yyyy", {
    locale: es,
  });
  // (Usamos new Date(1970...) para que 'format' interprete la hora correctamente)
  const hora = `${format(new Date(`1970-01-01T${horaInicio}Z`), "HH:mm")} - ${format(new Date(`1970-01-01T${horaFin}Z`), "HH:mm")} hs`;
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
