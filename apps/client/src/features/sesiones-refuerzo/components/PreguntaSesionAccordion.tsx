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
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ComputerIcon from "@mui/icons-material/Computer";
import PersonIcon from "@mui/icons-material/Person";
import type { PreguntaConDetalles } from "../../../types";
import GradeChip from "../../../components/GradeChip";
import TemaChip from "../../../components/TemaChip";

interface PreguntaSesionAccordionProps {
  pregunta: PreguntaConDetalles;
  onRemove?: () => void; // Opcional: solo si se permite quitar de la lista
}

export default function PreguntaSesionAccordion({
  pregunta,
  onRemove,
}: PreguntaSesionAccordionProps) {
  const {
    enunciado,
    gradoDificultad,
    opcionesRespuesta,
    dificultad,
    docenteCreador,
  } = pregunta;

  const isSistema = !docenteCreador;

  return (
    <Accordion variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          {/* Columna Izquierda: Enunciado y nombre de la dificultad */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" noWrap>
              {dificultad?.nombre || "Dificultad"}
            </Typography>
            <Typography variant="subtitle1" noWrap>
              {enunciado}
            </Typography>
          </Box>

          {/* Columna Derecha: Chips de metadatos */}
          <Box>
            <Stack direction="row" spacing={1}>
              {dificultad?.tema && <TemaChip tema={dificultad.tema} small />}
              <GradeChip grado={gradoDificultad} texto="Grado" small />
              <Chip
                icon={isSistema ? <ComputerIcon /> : <PersonIcon />}
                label={isSistema ? "Sistema" : "Docente"}
                variant="outlined"
                size="small"
              />
            </Stack>
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
                  <ListItemText primary={opcion.textoOpcion} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Acción de quitar de la lista (solo si onRemove existe) */}
          {onRemove && (
            <>
              <Divider />
              <CardActions sx={{ justifyContent: "flex-end", p: 0, pt: 1 }}>
                <Tooltip title="Quitar de esta sesión">
                  <IconButton size="small" onClick={onRemove} color="error">
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
