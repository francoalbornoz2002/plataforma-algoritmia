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
  Grid,
  Paper,
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
  onResolver?: (idSesion: string) => void;
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
    <Paper
      elevation={2}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: isCancelada ? 0.6 : 1,
        borderLeft: "5px solid",
        borderColor:
          getEstadoChipColor(estado) === "default"
            ? "divider"
            : `${getEstadoChipColor(estado)}.main`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Título (Nro Sesión) y Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            fontWeight="bold"
            color="text.secondary"
            sx={{ textTransform: "uppercase" }}
          >
            Sesión #{nroSesion}
          </Typography>
          <Chip
            label={EstadoSesionLabels[estado]}
            color={getEstadoChipColor(estado)}
            size="small"
            sx={{ fontSize: "0.7rem" }}
          />
        </Box>

        {/* Información Principal: Dificultad y Grado */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ mb: 2, mt: 1 }}
        >
          <PsychologyIcon color="primary" />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Dificultad a reforzar
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ lineHeight: 1.2 }}
            >
              {dificultad.nombre}
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                color:
                  gradoSesion === grado_dificultad.Bajo
                    ? "success.main"
                    : gradoSesion === grado_dificultad.Medio
                      ? "warning.main"
                      : gradoSesion === grado_dificultad.Alto
                        ? "error.main"
                        : "text.secondary",
              }}
            >
              Grado:{" "}
              {gradoSesion === grado_dificultad.Ninguno ? "N/A" : gradoSesion}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2, borderStyle: "dashed" }} />

        {/* Grid de Detalles */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Stack spacing={0.5}>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                color="text.secondary"
              >
                {isAutomatic ? (
                  <SmartToyIcon sx={{ fontSize: 16 }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 16 }} />
                )}
                <Typography variant="caption" fontWeight="bold">
                  Asignada por
                </Typography>
              </Stack>
              <Typography variant="body2" noWrap>
                {nombreDocente}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack spacing={0.5}>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                color="text.secondary"
              >
                <EventIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight="bold">
                  Fecha límite
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="baseline"
                color="text.secondary"
              >
                <Typography variant="body2">{fechaLimiteStr}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {horaLimiteStr} hs
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack spacing={0.5}>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                color="text.secondary"
              >
                <TimerIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight="bold">
                  Duración
                </Typography>
              </Stack>
              <Typography variant="body2">{tiempoLimite} min</Typography>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>

      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "flex-end", p: 1, px: 2, gap: 1 }}>
        {canResolver && onResolver && (
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
      </CardActions>
    </Paper>
  );
}
