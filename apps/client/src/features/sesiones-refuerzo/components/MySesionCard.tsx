import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
  CardActions,
  Button,
  Chip,
} from "@mui/material";
// Íconos
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import PsychologyIcon from "@mui/icons-material/Psychology";
import TimerIcon from "@mui/icons-material/Timer";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SmartToyIcon from "@mui/icons-material/SmartToy";

// Tipos y Utilidades
import type { SesionRefuerzoResumen } from "../../../types";
import { estado_sesion, grado_dificultad } from "../../../types";
import { format } from "date-fns";
import { EstadoSesionLabels } from "../../../types/traducciones";

interface MySesionCardProps {
  sesion: SesionRefuerzoResumen;
  onResolver: (idSesion: string) => void;
  onViewDetails: (sesion: SesionRefuerzoResumen) => void;
}

export default function MySesionCard({
  sesion,
  onResolver,
  onViewDetails,
}: MySesionCardProps) {
  const {
    id,
    nroSesion,
    dificultad,
    gradoSesion,
    docente,
    fechaHoraLimite,
    tiempoLimite,
    estado,
  } = sesion;

  const isPendiente = estado === estado_sesion.Pendiente;
  const isCancelada = estado === estado_sesion.Cancelada;
  const isCompletada = estado === estado_sesion.Completada;

  // Validar si la fecha límite ya pasó
  const now = new Date();
  const deadline = new Date(fechaHoraLimite);
  const isExpired = now > deadline;

  // Solo se puede resolver si está pendiente y no ha expirado
  const canResolver = isPendiente && !isExpired;

  const fechaLimiteStr = format(deadline, "dd/MM/yyyy");
  const horaLimiteStr = format(deadline, "HH:mm");

  const isAutomatic = !docente;
  const nombreDocente = docente
    ? `${docente.nombre} ${docente.apellido}`
    : "Sistema (Automática)";

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

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {isAutomatic ? (
            <SmartToyIcon fontSize="small" color="primary" />
          ) : (
            <PersonIcon fontSize="small" />
          )}
          <Typography
            variant="body2"
            color={isAutomatic ? "primary.main" : "text.secondary"}
            fontWeight={isAutomatic ? "medium" : "regular"}
          >
            Asignada por: {nombreDocente}
          </Typography>
        </Stack>

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

      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "space-between", p: 1, px: 2 }}>
        {canResolver && (
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => onResolver(id)}
            startIcon={<PlayArrowIcon />}
          >
            Resolver
          </Button>
        )}
        {isCompletada && (
          <Button
            size="small"
            color="primary"
            onClick={() => onViewDetails(sesion)}
            startIcon={<AssessmentIcon />}
          >
            Ver Resultados
          </Button>
        )}
        <Box /> {/* Espaciador para alinear a la derecha si no hay botón */}
      </CardActions>
    </Card>
  );
}
