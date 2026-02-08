// src/pages/Alumno/consultas/ConsultaAccordionAlumno.tsx

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Stack,
  Divider,
  CardActions,
  Button,
  Rating,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // <-- 2. Nuevo
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import type { Consulta } from "../../../types";
import { estado_consulta } from "../../../types";

import TemaChip from "../../../components/TemaChip";
import EstadoConsultaChip from "../../../components/EstadoConsultaChip";

interface ConsultaAccordionAlumnoProps {
  consulta: Consulta;
  onValorar?: (consulta: Consulta) => void;
  onEdit?: (consulta: Consulta) => void;
  onDelete?: (consulta: Consulta) => void;
}

export default function ConsultaAccordionAlumno({
  consulta,
  onValorar,
  onEdit,
  onDelete,
}: ConsultaAccordionAlumnoProps) {
  const {
    titulo,
    descripcion,
    tema,
    estado,
    respuestaConsulta,
    valoracionAlumno,
    deletedAt,
  } = consulta;

  const isDeleted = !!deletedAt;

  // 1. Formateo de Fecha de Consulta (la del Alumno)
  // (Usamos el "hack" de string-split para evitar UTC)
  const fechaConsultaString = consulta.fechaConsulta.split("T")[0];
  const [yearC, monthC, dayC] = fechaConsultaString.split("-");
  const fechaConsultaFormateada = `${dayC}/${monthC}/${yearC}`;

  // 2. Formateo de Fecha de Respuesta (la del Docente)
  let fechaRespuestaFormateada = ""; // Default
  if (respuestaConsulta) {
    const fechaRespuestaString = respuestaConsulta.fechaRespuesta.split("T")[0];
    const [yearR, monthR, dayR] = fechaRespuestaString.split("-");
    fechaRespuestaFormateada = `${dayR}/${monthR}/${yearR}`;
  }

  return (
    <Accordion
      variant="outlined"
      // Si está borrada, la deshabilitamos
      disabled={isDeleted}
      // 4. Mantenemos la opacidad si está borrada
      sx={{ opacity: isDeleted ? 0.6 : 1.0 }}
    >
      {/* --- 5. EL RESUMEN --- */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          {/* Columna Izquierda: Título y Tema */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" noWrap>
              {fechaConsultaFormateada}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="h6" noWrap>
                {titulo}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <TemaChip tema={tema} />
            </Stack>
          </Box>
          {/* Columna Derecha: Estado */}
          <Box>
            {isDeleted ? (
              <Chip
                icon={<DeleteSweepIcon />}
                label="Dada de baja"
                color="error"
                size="small"
                variant="filled"
              />
            ) : (
              <EstadoConsultaChip estado={estado} />
            )}
          </Box>
        </Stack>
      </AccordionSummary>

      {/* --- 6. EL DETALLE --- */}
      <AccordionDetails sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={2}>
          {/* Descripción (pregunta) */}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Tu Consulta
            </Typography>
            <Typography variant="body2">{descripcion}</Typography>
          </Box>

          {/* Respuesta (si existe) */}
          {respuestaConsulta && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Respuesta de {respuestaConsulta.docente.nombre}{" "}
                  {respuestaConsulta.docente.apellido} (
                  {fechaRespuestaFormateada})
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {respuestaConsulta.descripcion}
                </Typography>
              </Box>
            </>
          )}

          {/* Acciones (si no está borrada) */}
          {!isDeleted && (
            <>
              <Divider />
              <CardActions sx={{ justifyContent: "flex-end", p: 0, pt: 1 }}>
                {estado === estado_consulta.Pendiente && (
                  <Box>
                    {onEdit && (
                      <Tooltip title="Editar consulta">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(consulta)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title="Dar de baja consulta">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(consulta)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
                {estado === estado_consulta.Revisada && onValorar && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onValorar(consulta)}
                  >
                    Valorar Respuesta
                  </Button>
                )}
                {estado === estado_consulta.Resuelta && (
                  <Stack
                    direction="column"
                    alignItems="flex-end"
                    sx={{ pr: 1 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Tu valoración:
                    </Typography>
                    <Rating value={valoracionAlumno} readOnly />
                  </Stack>
                )}
              </CardActions>
            </>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
