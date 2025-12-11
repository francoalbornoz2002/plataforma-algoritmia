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
import SchoolIcon from "@mui/icons-material/School"; // Para el alumno
import PsychologyIcon from "@mui/icons-material/Psychology"; // Para dificultad
import TimerIcon from "@mui/icons-material/Timer"; // Para tiempo límite
import InfoIcon from "@mui/icons-material/Info"; // Para ver detalles

// Tipos y Componentes
import type { SesionRefuerzoResumen } from "../../../types";
import { estado_sesion, grado_dificultad } from "../../../types";
import { format } from "date-fns";
import { EstadoSesionLabels } from "../../../types/traducciones";

interface SesionCardProps {
  sesion: SesionRefuerzoResumen;
  onEdit: (sesion: SesionRefuerzoResumen) => void;
  onDelete: (sesion: SesionRefuerzoResumen) => void;
  onViewDetails: (sesion: SesionRefuerzoResumen) => void;
}

export default function SesionCard({
  sesion,
  onEdit,
  onDelete,
  onViewDetails,
}: SesionCardProps) {
  const {
    nroSesion,
    dificultad,
    gradoSesion,
    docente,
    alumno,
    fechaHoraLimite,
    tiempoLimite,
    estado,
  } = sesion;

  // --- Reglas de Negocio (UI) ---

  const isPendiente = estado === estado_sesion.Pendiente;
  const isCancelada = estado === estado_sesion.Cancelada;
  const isCompletada = estado === estado_sesion.Completada;

  // Solo se puede editar/borrar si está "Pendiente" y la fecha límite no ha pasado
  const canEditOrDelete = isPendiente && new Date() < new Date(fechaHoraLimite);

  // Formateo de Fecha y Hora Límite
  const fechaLimiteObj = new Date(fechaHoraLimite);
  const fechaLimiteStr = format(fechaLimiteObj, "dd/MM/yyyy");
  const horaLimiteStr = format(fechaLimiteObj, "HH:mm");

  // Manejo seguro del docente
  const nombreDocente = docente
    ? `${docente.nombre} ${docente.apellido}`
    : "Sistema (Automática)";

  // Colores para el chip de estado
  const getEstadoChipColor = (currentEstado: estado_sesion) => {
    switch (currentEstado) {
      case estado_sesion.Pendiente:
        return "info";
      case estado_sesion.Completada:
        return "success";
      case estado_sesion.Incompleta:
      case estado_sesion.No_realizada:
        return "warning";
      case estado_sesion.Cancelada:
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: isCancelada ? 0.6 : 1,
        borderColor: isPendiente ? "primary.main" : undefined,
        borderWidth: isPendiente ? 2 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Fila 1: Título (Nro Sesión) y Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" component="div">
            Sesión N° {nroSesion}
          </Typography>
          <Chip
            label={EstadoSesionLabels[estado]}
            color={getEstadoChipColor(estado)}
            size="small"
          />
        </Box>

        {/* Fila 2: Alumno Asignado */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          <SchoolIcon fontSize="small" />
          <Typography variant="body2">
            Alumno: {alumno.nombre} {alumno.apellido}
          </Typography>
        </Stack>

        {/* Fila 3: Docente Creador */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          <PersonIcon fontSize="small" />
          <Typography variant="body2">Creada por: {nombreDocente}</Typography>
        </Stack>

        {/* Fila 4: Detalles de Dificultad y Grado */}
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <PsychologyIcon fontSize="small" />
            <Typography variant="body2">
              Dificultad: {dificultad.nombre} (Grado:{" "}
              {gradoSesion === grado_dificultad.Ninguno ? "N/A" : gradoSesion})
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <EventIcon fontSize="small" />
            <Typography variant="body2">
              Fecha Límite: {fechaLimiteStr}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">
              Hora Límite: {horaLimiteStr}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <TimerIcon fontSize="small" />
            <Typography variant="body2">
              Tiempo: {tiempoLimite} minutos
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* Fila de Acciones */}
      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "space-between", p: 1, px: 2 }}>
        <Button
          size="small"
          onClick={() => onViewDetails(sesion)}
          startIcon={<InfoIcon />}
        >
          Ver Detalles
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {canEditOrDelete && (
            <>
              <Tooltip title="Editar Sesión">
                <IconButton size="small" onClick={() => onEdit(sesion)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancelar Sesión">
                <IconButton
                  size="small"
                  onClick={() => onDelete(sesion)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}
