import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Rating,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

// Tipos, Schemas y Servicios
import { type ConsultaDocente, estado_consulta } from "../../../types";
import {
  createRespuestaSchema,
  type CreateRespuestaFormValues,
} from "../validations/createRespuesta.schema";
import { createRespuesta } from "../../users/services/docentes.service";

// Chips Reutilizables
import TemaChip from "../../../components/TemaChip";
import EstadoConsultaChip from "../../../components/EstadoConsultaChip";
import { enqueueSnackbar } from "notistack";

interface ConsultaAccordionProps {
  consulta: ConsultaDocente;
  onResponseSuccess?: () => void; // Para refrescar la lista (Opcional)
}

export default function ConsultaAccordion({
  consulta,
  onResponseSuccess,
}: ConsultaAccordionProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // Estado de RHF para el formulario de respuesta
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRespuestaFormValues>({
    resolver: zodResolver(createRespuestaSchema),
    defaultValues: { descripcion: "" },
  });

  const { respuestaConsulta } = consulta;

  // Handler para enviar la respuesta
  const onSubmit: SubmitHandler<CreateRespuestaFormValues> = async (data) => {
    setApiError(null);
    try {
      await createRespuesta(consulta.id, data);
      enqueueSnackbar("Respuesta enviada correctamente", {
        variant: "success",
      });
      if (onResponseSuccess) onResponseSuccess(); // Avisa a la página que refresque
      reset(); // Limpia el formulario
      setShowReplyForm(false); // Oculta el formulario tras el éxito
    } catch (err: any) {
      setApiError(err.message || "Error al enviar la respuesta.");
      enqueueSnackbar(err.message || "Error al enviar la respuesta.", {
        variant: "error",
      });
    }
  };

  const isPendiente = consulta.estado === estado_consulta.Pendiente;
  const isRevisada = consulta.estado === estado_consulta.Revisada;
  const isResuelta = consulta.estado === estado_consulta.Resuelta;

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

  // 2. Formateo de Fecha de Respuesta (la del Docente)
  let fechaRespuestaFormateada = ""; // Default
  if (respuestaConsulta) {
    const dateR = new Date(respuestaConsulta.fechaRespuesta);
    fechaRespuestaFormateada = `${dateR.getDate().toString().padStart(2, "0")}/${(dateR.getMonth() + 1).toString().padStart(2, "0")}/${dateR.getFullYear()}`;
  }

  return (
    // Deshabilitamos el acordeón si ya está resuelta
    <Accordion variant="outlined">
      {/* --- 1. El Resumen (lo que se ve siempre) --- */}
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
              consulta.alumno.fotoPerfilUrl
                ? `${baseUrl}${consulta.alumno.fotoPerfilUrl}`
                : undefined
            }
            alt={`${consulta.alumno.nombre} ${consulta.alumno.apellido}`}
          >
            {!consulta.alumno.fotoPerfilUrl && consulta.alumno.nombre.charAt(0)}
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
                {consulta.titulo}
              </Typography>
              <TemaChip tema={consulta.tema} small />
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              de {consulta.alumno.nombre} {consulta.alumno.apellido} -{" "}
              {fechaConsultaFormateada}
            </Typography>
          </Box>

          {/* Columna Derecha: Estado */}
          <Stack direction="row" spacing={1} alignItems="center">
            <EstadoConsultaChip estado={consulta.estado} small />
          </Stack>
        </Stack>
      </AccordionSummary>

      {/* --- 2. El Detalle (lo que se expande) --- */}
      <AccordionDetails sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={3}>
          {/* Descripción del Alumno */}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Descripcion de la consulta
            </Typography>
            <Typography variant="body2">{consulta.descripcion}</Typography>
          </Box>

          <Divider />

          {/* Botón de Responder o Formulario (si está Pendiente) */}
          {isPendiente && onResponseSuccess && !showReplyForm && (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="text" onClick={() => setShowReplyForm(true)}>
                Responder
              </Button>
            </Box>
          )}

          {isPendiente && onResponseSuccess && showReplyForm && (
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              id={`form-consulta-${consulta.id}`}
            >
              <Stack>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Escribe tu respuesta aquí..."
                      fullWidth
                      multiline
                      rows={4}
                      error={!!errors.descripcion}
                      helperText={errors.descripcion?.message || " "}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {apiError && <Alert severity="error">{apiError}</Alert>}

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowReplyForm(false);
                      reset();
                      setApiError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Enviar Respuesta"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Respuesta (si ya está Revisada o Resuelta) */}
          {(isRevisada || isResuelta) && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                {respuestaConsulta
                  ? `Tu Respuesta (${fechaRespuestaFormateada})`
                  : "Respuesta / Resolución"}
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {respuestaConsulta
                  ? respuestaConsulta.descripcion
                  : "Esta consulta fue atendida verbalmente en una clase de consulta."}
              </Typography>
            </Box>
          )}

          {/* Valoración (si ya está Resuelta) */}
          {isResuelta && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Typography variant="overline" color="text.secondary">
                  Valoración del Alumno
                </Typography>
                <Rating
                  value={consulta.valoracionAlumno || 0}
                  readOnly
                  size="small"
                />
              </Stack>
              <Typography variant="body2">
                {consulta.comentarioValoracion || "(Sin comentario)"}
              </Typography>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
