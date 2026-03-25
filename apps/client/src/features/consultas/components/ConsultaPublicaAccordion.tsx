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
import { estado_consulta, type ConsultaDocente } from "../../../types";
import TemaChip from "../../../components/TemaChip";

interface ConsultaPublicaAccordionProps {
  consulta: ConsultaDocente;
}

export default function ConsultaPublicaAccordion({
  consulta,
}: ConsultaPublicaAccordionProps) {
  const { titulo, descripcion, tema, respuestaConsulta, alumno } = consulta;

  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // 1. Formateo de Fecha de Consulta
  const dateC = new Date(consulta.createdAt);
  const diaSemana = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
  }).format(dateC);
  const diaCapitalizado =
    diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const fechaCStr = `${dateC.getDate().toString().padStart(2, "0")}/${(dateC.getMonth() + 1).toString().padStart(2, "0")}/${dateC.getFullYear()}`;
  const horaCStr = `${dateC.getHours().toString().padStart(2, "0")}:${dateC.getMinutes().toString().padStart(2, "0")}`;
  const fechaConsultaFormateada = `${diaCapitalizado}, ${fechaCStr} a las ${horaCStr}`;

  // Formateo de Fecha de Respuesta
  let fechaRespuestaFormateada = "";
  if (respuestaConsulta) {
    const dateR = new Date(respuestaConsulta.fechaRespuesta);
    fechaRespuestaFormateada = `${dateR.getDate().toString().padStart(2, "0")}/${(dateR.getMonth() + 1).toString().padStart(2, "0")}/${dateR.getFullYear()}`;
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
          {/* Avatar del Alumno */}
          <Avatar
            src={
              alumno?.fotoPerfilUrl
                ? `${baseUrl}${alumno.fotoPerfilUrl}`
                : undefined
            }
            alt={`${alumno?.nombre} ${alumno?.apellido}`}
          >
            {!alumno?.fotoPerfilUrl && alumno?.nombre?.charAt(0)}
          </Avatar>

          {/* Columna Central: Título, Tema, Alumno y Fecha */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {titulo}
              </Typography>
              <TemaChip tema={tema} small />
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              de {alumno?.nombre} {alumno?.apellido} - {fechaConsultaFormateada}
            </Typography>
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

          {/* Respuesta o Resolución */}
          {respuestaConsulta ||
          consulta.estado === estado_consulta.Revisada ||
          consulta.estado === estado_consulta.Resuelta ? (
            <>
              <Divider />
              <Box>
                {respuestaConsulta ? (
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
                ) : (
                  <Typography variant="overline" color="text.secondary">
                    Respuesta / Resolución
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {respuestaConsulta
                    ? respuestaConsulta.descripcion
                    : "Esta consulta fue atendida verbalmente en una clase de consulta."}
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
