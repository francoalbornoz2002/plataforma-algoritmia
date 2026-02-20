import {
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
  Grid,
  Paper,
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
  onEdit?: (sesion: SesionRefuerzoResumen) => void;
  onDelete?: (sesion: SesionRefuerzoResumen) => void;
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

  // Solo se puede editar/borrar si está "Pendiente" y la fecha límite no ha pasado
  const canEditOrDelete = isPendiente && new Date() < new Date(fechaHoraLimite);

  // Formateo de Fecha y Hora Límite
  const fechaLimiteObj = new Date(fechaHoraLimite);
  const fechaLimiteStr = format(fechaLimiteObj, "dd/MM/yy");
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
            sx={{ fontSize: "0.7rem", fontWeight: "bold" }}
          />
        </Box>

        {/* Información Principal: Alumno */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <SchoolIcon color="primary" />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Alumno asignado
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ lineHeight: 1.2 }}
            >
              {alumno.nombre} {alumno.apellido}
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
                <PsychologyIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight="bold">
                  Dificultad
                </Typography>
              </Stack>
              <Typography variant="body2" noWrap>
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
            </Stack>
          </Grid>

          <Grid size={{ xs: 4 }}>
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

          <Grid size={{ xs: 4 }}>
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

          <Grid size={{ xs: 4 }}>
            <Stack spacing={0.5}>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                color="text.secondary"
              >
                <PersonIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight="bold">
                  Creador
                </Typography>
              </Stack>
              <Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
                {docente ? docente.nombre : "Sistema"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>

      {/* Fila de Acciones */}
      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "space-between", p: 1, px: 2 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => onViewDetails(sesion)}
          startIcon={<InfoIcon />}
        >
          Detalles
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {canEditOrDelete && (
            <>
              {onEdit && (
                <Tooltip title="Editar Sesión">
                  <IconButton size="small" onClick={() => onEdit(sesion)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Cancelar Sesión">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(sesion)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </CardActions>
    </Paper>
  );
}
