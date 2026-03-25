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
  onEdit?: (pregunta: PreguntaConDetalles) => void;
  onDelete?: (pregunta: PreguntaConDetalles) => void;
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
        <Stack spacing={2} sx={{ width: "100%" }}>
          {/* Fila 1: Nombre de la dificultad y chips metadatos */}
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="overline" color="text.secondary">
              {dificultad?.nombre || "Dificultad"}
            </Typography>
            <Box>
              {isDeleted ? (
                <Chip
                  icon={<DeleteSweepIcon />}
                  label="Dada de baja"
                  color="error"
                  size="small"
                  variant="filled"
                  sx={{ p: 0.5, fontSize: 10 }}
                />
              ) : (
                <Stack direction="row" spacing={0.5}>
                  {dificultad?.tema && (
                    <TemaChip
                      tema={dificultad.tema}
                      small
                      sx={{ p: 0.5, fontSize: 10 }}
                    />
                  )}
                  <GradeChip
                    grado={gradoDificultad}
                    texto="Grado"
                    small
                    sx={{ p: 0.5, fontSize: 10 }}
                  />
                  <Chip
                    icon={isSistema ? <ComputerIcon /> : <PersonIcon />}
                    label={isSistema ? "Sistema" : "Docente"}
                    variant="outlined"
                    size="small"
                    sx={{ p: 0.5, fontSize: 10 }}
                  />
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Fila 2: Enunciado */}
          <Typography variant="subtitle2" sx={{ wordBreak: "break-word" }}>
            {enunciado}
          </Typography>
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
          {!isDeleted && !isSistema && onEdit && onDelete && (
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
