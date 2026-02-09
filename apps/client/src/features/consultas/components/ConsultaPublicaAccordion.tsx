import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Stack,
  Divider,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ConsultaDocente } from "../../../types";
import TemaChip from "../../../components/TemaChip";

interface ConsultaPublicaAccordionProps {
  consulta: ConsultaDocente;
}

export default function ConsultaPublicaAccordion({
  consulta,
}: ConsultaPublicaAccordionProps) {
  const { titulo, descripcion, tema, respuestaConsulta, alumno } = consulta;

  // Formateo de Fecha de Consulta
  const fechaConsultaString = consulta.fechaConsulta.split("T")[0];
  const [yearC, monthC, dayC] = fechaConsultaString.split("-");
  const fechaConsultaFormateada = `${dayC}/${monthC}/${yearC}`;

  // Formateo de Fecha de Respuesta
  let fechaRespuestaFormateada = "";
  if (respuestaConsulta) {
    const fechaRespuestaString = respuestaConsulta.fechaRespuesta.split("T")[0];
    const [yearR, monthR, dayR] = fechaRespuestaString.split("-");
    fechaRespuestaFormateada = `${dayR}/${monthR}/${yearR}`;
  }

  return (
    <Accordion variant="outlined">
      {/* --- RESUMEN --- */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="overline" noWrap>
                {fechaConsultaFormateada}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • Realizada por: {alumno?.nombre} {alumno?.apellido}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" noWrap>
                {titulo}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <TemaChip tema={tema} />
            </Stack>
          </Box>
        </Stack>
      </AccordionSummary>

      {/* --- DETALLE --- */}
      <AccordionDetails sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={2}>
          {/* Consulta */}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Consulta
            </Typography>
            <Typography variant="body2">{descripcion}</Typography>
          </Box>

          {/* Respuesta (si existe) */}
          {respuestaConsulta ? (
            <>
              <Divider />
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {respuestaConsulta.docente.nombre[0]}
                  </Avatar>
                  <Typography variant="overline" color="text.secondary">
                    Respuesta de {respuestaConsulta.docente.nombre}{" "}
                    {respuestaConsulta.docente.apellido} (
                    {fechaRespuestaFormateada})
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {respuestaConsulta.descripcion}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              Aún no hay respuesta del docente.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
