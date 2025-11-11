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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos, Schemas y Servicios
import {
  type Consulta,
  type ConsultaDocente,
  estado_consulta,
} from "../../../types";
import {
  createRespuestaSchema,
  type CreateRespuestaFormValues,
} from "../validations/createRespuesta.schema";
import { createRespuesta } from "../../users/services/docentes.service";

// Chips Reutilizables
import TemaChip from "../../../components/TemaChip";
import EstadoConsultaChip from "../../../components/EstadoConsultaChip";

interface ConsultaAccordionProps {
  consulta: ConsultaDocente;
  onResponseSuccess: () => void; // Para refrescar la lista
}

export default function ConsultaAccordion({
  consulta,
  onResponseSuccess,
}: ConsultaAccordionProps) {
  const [apiError, setApiError] = useState<string | null>(null);

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
      onResponseSuccess(); // Avisa a la página que refresque
      reset(); // Limpia el formulario
    } catch (err: any) {
      setApiError(err.message || "Error al enviar la respuesta.");
    }
  };

  const isPendiente = consulta.estado === estado_consulta.Pendiente;
  const isRevisada = consulta.estado === estado_consulta.Revisada;
  const isResuelta = consulta.estado === estado_consulta.Resuelta;

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
    // Deshabilitamos el acordeón si ya está resuelta
    <Accordion>
      {/* --- 1. El Resumen (lo que se ve siempre) --- */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          {/* Columna Izquierda: Alumno y Título */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              Consulta de {consulta.alumno.nombre} {consulta.alumno.apellido} (
              {fechaConsultaFormateada})
            </Typography>
            <Typography variant="h6" noWrap>
              {consulta.titulo}
            </Typography>
          </Box>
          {/* Columna Derecha: Tema y Estado */}
          <Stack direction="row" spacing={1} alignItems="center">
            <TemaChip tema={consulta.tema} />
            <EstadoConsultaChip estado={consulta.estado} />
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

          {/* Formulario de Respuesta (si está Pendiente) */}
          {isPendiente && (
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              id={`form-consulta-${consulta.id}`}
            >
              <Stack spacing={2}>
                <Typography variant="h6">Responder Consulta</Typography>
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
                      helperText={errors.descripcion?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {apiError && <Alert severity="error">{apiError}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ alignSelf: "flex-end" }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Enviar Respuesta"
                  )}
                </Button>
              </Stack>
            </Box>
          )}

          {/* Respuesta (si ya está Revisada o Resuelta) */}
          {(isRevisada || isResuelta) && respuestaConsulta && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Tu Respuesta ({fechaRespuestaFormateada})
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {consulta.respuestaConsulta!.descripcion}
              </Typography>
            </Box>
          )}

          {/* Valoración (si ya está Resuelta) */}
          {isResuelta && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Valoración del Alumno
              </Typography>
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
