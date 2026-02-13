import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Stack,
  Divider,
  CardActions,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ComputerIcon from "@mui/icons-material/Computer";
import PersonIcon from "@mui/icons-material/Person";
import type { PreguntaConDetalles } from "../../../types";
import GradeChip from "../../../components/GradeChip";
import TemaChip from "../../../components/TemaChip";

interface PreguntaAccordionProps {
  pregunta: PreguntaConDetalles;
  onEdit: (pregunta: PreguntaConDetalles) => void;
  onDelete: (pregunta: PreguntaConDetalles) => void;
}

export default function PreguntaAccordion({
  pregunta,
  onEdit,
  onDelete,
}: PreguntaAccordionProps) {
  const {
    enunciado,
    gradoDificultad,
    opcionesRespuesta,
    dificultad,
    docenteCreador,
    deletedAt,
  } = pregunta;

  const isDeleted = !!deletedAt;
  const isSistema = !docenteCreador;

  return (
    <Accordion
      variant="outlined"
      disabled={isDeleted}
      sx={{ opacity: isDeleted ? 0.6 : 1.0 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          {/* Columna Izquierda: Enunciado y nombre de la dificultad */}
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {dificultad.nombre}
            </Typography>
            <Typography variant="subtitle2" sx={{ wordBreak: "break-word" }}>
              {enunciado}
            </Typography>
          </Stack>

          {/* Columna Derecha: Chips de metadatos */}
          <Box sx={{ flexShrink: 0 }}>
            {isDeleted ? (
              <Chip
                icon={<DeleteSweepIcon />}
                label="Dada de baja"
                color="error"
                size="small"
                variant="filled"
              />
            ) : (
              <Stack direction="row" spacing={1}>
                <TemaChip tema={dificultad.tema} small />
                <GradeChip grado={gradoDificultad} texto="Grado" small />
                <Chip
                  icon={isSistema ? <ComputerIcon /> : <PersonIcon />}
                  label={isSistema ? "Sistema" : "Docente"}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            )}
          </Box>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={2}>
          {/* Opciones de Respuesta */}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Opciones de Respuesta
            </Typography>
            <List dense sx={{ p: 0 }}>
              {opcionesRespuesta.map((opcion) => (
                <ListItem key={opcion.id} sx={{ p: 0, pl: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {opcion.esCorrecta ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon
                        color="disabled"
                        fontSize="small"
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={opcion.textoOpcion}
                    primaryTypographyProps={{
                      fontWeight: opcion.esCorrecta ? "bold" : "normal",
                      color: opcion.esCorrecta
                        ? "success.dark"
                        : "text.primary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Acciones */}
          {!isDeleted && !isSistema && (
            <>
              <Divider />
              <CardActions sx={{ justifyContent: "flex-end", p: 0, pt: 1 }}>
                <Tooltip title="Editar pregunta">
                  <IconButton size="small" onClick={() => onEdit(pregunta)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dar de baja pregunta">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(pregunta)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
