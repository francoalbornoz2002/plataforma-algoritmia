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
import { CheckCircle } from "@mui/icons-material";
import FactCheckIcon from "@mui/icons-material/FactCheck"; // Para finalizar
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline"; // Para en curso
import { format } from "date-fns";
import { EstadoClaseChip } from "../../../components/EstadoClaseChip";

interface ClaseConsultaCardProps {
  clase: ClaseConsulta;
  onEdit: (clase: ClaseConsulta) => void;
  onDelete: (clase: ClaseConsulta) => void;
  onViewDetails: (clase: ClaseConsulta) => void;
  onAccept?: (clase: ClaseConsulta) => void;
  onFinalize?: (clase: ClaseConsulta) => void;
}

export default function ClaseConsultaCard({
  clase,
  onEdit,
  onDelete,
  onViewDetails,
  onAccept,
  onFinalize,
}: ClaseConsultaCardProps) {
  const {
    nombre,
    descripcion,
    fechaClase,
    horaInicio,
    horaFin,
    modalidad,
    estadoClase,
    estadoActual,
    docenteResponsable,
    consultasEnClase,
    deletedAt,
  } = clase;

  // --- Reglas de Negocio (UI) ---

  // Determinamos qué estado mostrar: El calculado (tiempo) o el de la BD
  const estadoVisual = estadoActual || estadoClase;

  // Banderas de estado temporal
  const isEnCurso = estadoVisual === estado_clase_consulta.En_curso;
  const isPorCerrar = estadoVisual === estado_clase_consulta.Finalizada;

  // 1. Detectar si está pendiente de asignación
  const isPendienteAsignacion =
    estadoClase === estado_clase_consulta.Pendiente_Asignacion;

  // Solo se puede editar/borrar si está "Programada"
  const isProgramada = estadoClase === estado_clase_consulta.Programada;
  // 'deletedAt' es el 'soft delete' (que también la pone en estado 'Cancelada')
  const isCanceled = !!deletedAt;

  // 2. Bloqueo de Edición:
  // Solo se edita si está programada Y NO ha empezado ni terminado por horario.
  const canEditOrDelete =
    isProgramada && !isEnCurso && !isPorCerrar && !isCanceled;

  // 1. Formateo de Fecha (el "hack" anti-UTC)
  const fechaString = fechaClase.split("T")[0]; // "2025-11-11"
  const [year, month, day] = fechaString.split("-");
  const fecha = `${day}/${month}/${year}`; // "11/11/2025"

  // 2. Formateo de Hora (CORREGIDO)
  // Convertimos el string ISO UTC a un objeto Date local
  // El navegador restará automáticamente las 3 horas (10:00 UTC -> 07:00 Local)
  const fechaInicioObj = new Date(horaInicio);
  const fechaFinObj = new Date(horaFin);

  // Formateamos a "HH:mm" usando date-fns
  const horaInicioStr = format(fechaInicioObj, "HH:mm");
  const horaFinStr = format(fechaFinObj, "HH:mm");

  const hora = `${horaInicioStr} - ${horaFinStr} hs`;

  // Manejo seguro del docente
  const nombreDocente = docenteResponsable
    ? `${docenteResponsable.nombre} ${docenteResponsable.apellido}`
    : "Sin asignar (Pendiente)";

  // --- NUEVO: Lógica de Conteo ---
  const totalConsultas = consultasEnClase?.length || 0;

  // Contamos las que el backend nos dice que fueron revisadas
  const revisadasCount =
    consultasEnClase?.filter((c: any) => c.revisadaEnClase).length || 0;

  // Definimos el texto a mostrar
  let textoConsultas = `${totalConsultas} consultas para revisar`;

  if (estadoClase === estado_clase_consulta.Realizada) {
    textoConsultas = `${revisadasCount} de ${totalConsultas} consultas revisadas`;
  } else if (estadoClase === estado_clase_consulta.No_realizada) {
    textoConsultas = `Clase no realizada (${totalConsultas} pendientes)`;
  }
  // --------------------------------

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // La hacemos opaca si fue cancelada/borrada
        opacity: isCanceled ? 0.6 : 1,
        // Borde especial: Naranja si pendiente, Verde si En Curso
        borderColor: isPendienteAsignacion
          ? "warning.main"
          : isEnCurso
            ? "success.main"
            : undefined,
        borderWidth: isPendienteAsignacion || isEnCurso ? 2 : 1,
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
          <EstadoClaseChip estado={estadoVisual} />
        </Box>

        {/* Fila 2: Descripción */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {descripcion}
        </Typography>

        {/* --- NUEVO: Aviso visual extra si está En Curso --- */}
        {isEnCurso && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "success.main",
            }}
          >
            <PlayCircleOutlineIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">
              CLASE TRANSCURRIENDO AHORA
            </Typography>
          </Box>
        )}

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
            color={!docenteResponsable ? "warning.main" : "text.secondary"}
          >
            <PersonIcon fontSize="small" />
            <Typography
              variant="body2"
              fontWeight={!docenteResponsable ? "bold" : "normal"}
            >
              {nombreDocente}
            </Typography>
          </Stack>
          {/* --- NUEVO: Renderizado del texto dinámico --- */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            color="text.secondary"
          >
            <QuestionAnswerIcon fontSize="small" />
            <Typography
              variant="body2"
              // Si está realizada, la ponemos en negrita o un color sutilmente distinto
              fontWeight={estadoClase === "Realizada" ? "bold" : "normal"}
              color={estadoClase === "Realizada" ? "primary.main" : "inherit"}
            >
              {textoConsultas}
            </Typography>
          </Stack>
          {/* --------------------------------------------- */}
        </Stack>
      </CardContent>

      {/* Fila 4: Acciones */}
      <Divider sx={{ mt: "auto" }} />
      <CardActions sx={{ justifyContent: "space-between", p: 1, px: 2 }}>
        {/* IZQUIERDA: Siempre la Modalidad */}
        <Chip label={modalidad} size="small" />

        {/* DERECHA: Acciones */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Botón de Ver Detalles (Siempre visible salvo cancelada) */}
          <Button
            size="small"
            onClick={() => onViewDetails(clase)}
            disabled={isCanceled}
          >
            Consultas ({totalConsultas})
          </Button>

          {/* Lógica Condicional de Botones de Acción */}
          {!isCanceled && (
            <>
              {/* CASO 1: PENDIENTE -> ACEPTAR */}
              {isPendienteAsignacion && (
                <Tooltip title="Aceptar y tomar esta clase">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onAccept && onAccept(clase)}
                    startIcon={<CheckCircle />}
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Aceptar
                  </Button>
                </Tooltip>
              )}

              {/* CASO 2: PROGRAMADA (Y NO EMPEZADA) -> EDITAR/BORRAR */}
              {canEditOrDelete && (
                <>
                  <Tooltip title="Editar Clase">
                    <IconButton size="small" onClick={() => onEdit(clase)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancelar Clase">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(clase)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* CASO 3: POR CERRAR -> FINALIZAR */}
              {isPorCerrar && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onFinalize && onFinalize(clase)}
                  startIcon={<FactCheckIcon />}
                >
                  Finalizar
                </Button>
              )}
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}
