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
        <Stack spacing={2} sx={{ width: "100%" }}>
          {/* Fila 1: Nombre de la dificultad y chips metadatos */}
          <Stack direction="row" spacing={0.5} justifyContent="space-between">
            <Typography variant="overline" color="text.secondary">
              {dificultad?.nombre || "Dificultad"}
            </Typography>
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
