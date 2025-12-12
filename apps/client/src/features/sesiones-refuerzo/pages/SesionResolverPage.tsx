import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Divider,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useCourseContext } from "../../../context/CourseContext";
import {
  findSesionById,
  iniciarSesion,
  resolverSesion,
} from "../service/sesiones-refuerzo.service";
import {
  type SesionRefuerzoConDetalles,
  type ResolverSesionResponse,
  estado_sesion,
} from "../../../types";
import { enqueueSnackbar } from "notistack";
import ResultadoSesionView from "../components/ResultadoSesionView";

export default function SesionResolverPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedCourse } = useCourseContext();
  const navigate = useNavigate();

  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [sesion, setSesion] = useState<SesionRefuerzoConDetalles | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResolverSesionResponse | null>(null);

  // --- Timer ---
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // en segundos
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Carga Inicial ---
  useEffect(() => {
    if (selectedCourse && id) {
      setLoading(true);
      findSesionById(selectedCourse.id, id)
        .then((data) => {
          setSesion(data);

          // Si ya está completada, mostramos un estado especial (o redirigimos)
          if (
            data.estado === estado_sesion.Completada &&
            data.resultadoSesion
          ) {
            // Podríamos reconstruir el objeto 'result' para mostrar la vista de resultados
            // o simplemente mostrar un mensaje. Por ahora, dejamos que el usuario vea que ya terminó.
          }

          // Si ya había iniciado (tiene fechaInicioReal) y sigue pendiente, calculamos el tiempo restante
          if (data.estado === estado_sesion.Pendiente && data.fechaInicioReal) {
            const inicio = new Date(data.fechaInicioReal).getTime();
            const limiteMs = data.tiempoLimite * 60 * 1000;
            const fin = inicio + limiteMs;
            const ahora = Date.now();
            const restantes = Math.floor((fin - ahora) / 1000);
            setTimeLeft(restantes > 0 ? restantes : 0);
          }
        })
        .catch((err) => {
          console.error(err);
          enqueueSnackbar("Error al cargar la sesión.", { variant: "error" });
          navigate("/my/sessions");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedCourse, id, navigate]);

  // --- Lógica del Timer ---
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !result) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && !result && !isSubmitting) {
      // Tiempo agotado: Enviar automáticamente
      handleSubmit();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]); // isSubmitting omitido para evitar loops, se controla dentro

  // --- Handlers ---

  const handleStart = async () => {
    if (!sesion || !selectedCourse) return;
    try {
      // Llamada al backend para marcar el inicio real
      await iniciarSesion(selectedCourse.id, sesion.id);
      // Iniciamos el timer localmente
      setTimeLeft(sesion.tiempoLimite * 60);
    } catch (error) {
      enqueueSnackbar("Error al iniciar la sesión.", { variant: "error" });
    }
  };

  const handleOptionChange = (idPregunta: string, idOpcion: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: idOpcion,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!sesion || !selectedCourse || isSubmitting) return;
    setIsSubmitting(true);

    // Formatear respuestas para el DTO
    const payload = {
      respuestas: Object.entries(respuestas).map(
        ([idPregunta, idOpcionElegida]) => ({
          idPregunta,
          idOpcionElegida,
        })
      ),
    };

    try {
      const data = await resolverSesion(selectedCourse.id, sesion.id, payload);
      setResult(data);

      // ¡CLAVE! Volvemos a buscar la sesión para obtener los resultados completos
      const updatedSesion = await findSesionById(selectedCourse.id, sesion.id);
      setSesion(updatedSesion);

      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(null);
      enqueueSnackbar("Sesión enviada correctamente.", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al enviar las respuestas.",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [sesion, selectedCourse, respuestas, isSubmitting]);

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sesion) return null;

  // VISTA 1: RESULTADOS (Si ya se resolvió)
  if (result || sesion.estado === estado_sesion.Completada) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            ¡Sesión Completada!
          </Typography>
          <Box sx={{ my: 3 }}>
            <ResultadoSesionView
              sesion={sesion}
              nuevoGrado={result?.resultados.nuevoGrado}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/my/sessions")}
          >
            Volver a Mis Sesiones
          </Button>
        </Paper>
      </Container>
    );
  }

  // VISTA 2: INTRODUCCIÓN (Si no ha iniciado)
  if (timeLeft === null) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Sesión de Refuerzo N° {sesion.nroSesion}
          </Typography>
          <Typography variant="body1" paragraph>
            Estás a punto de iniciar una sesión de refuerzo.
          </Typography>
          <Stack spacing={2} sx={{ my: 3, textAlign: "left" }}>
            <Alert severity="info">
              <strong>Tiempo Límite:</strong> {sesion.tiempoLimite} minutos.
            </Alert>
            <Alert severity="warning">
              Una vez iniciada, el tiempo correrá y no podrás pausarlo. Si el
              tiempo se agota, se enviarán las respuestas que hayas
              seleccionado.
            </Alert>
          </Stack>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" onClick={() => navigate("/my/sessions")}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleStart}
            >
              Comenzar Ahora
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // VISTA 3: EXAMEN (Si está corriendo)
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Header Fijo con Timer */}
      <Paper
        elevation={4}
        sx={{
          p: 2,
          mb: 3,
          position: "sticky",
          top: 16,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: timeLeft < 60 ? "#fff4f4" : "background.paper",
        }}
      >
        <Typography variant="h6">Sesión N° {sesion.nroSesion}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon color={timeLeft < 60 ? "error" : "action"} />
          <Typography
            variant="h5"
            color={timeLeft < 60 ? "error" : "text.primary"}
            sx={{ fontWeight: "bold", fontFamily: "monospace" }}
          >
            {formatTime(timeLeft)}
          </Typography>
        </Stack>
      </Paper>

      {/* Lista de Preguntas */}
      <Stack spacing={3}>
        {sesion.preguntas.map(({ pregunta }, index) => (
          <Card key={pregunta.id} variant="outlined">
            <CardContent>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Pregunta {index + 1}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {pregunta.enunciado}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <RadioGroup
                value={respuestas[pregunta.id] || ""}
                onChange={(e) =>
                  handleOptionChange(pregunta.id, e.target.value)
                }
              >
                {pregunta.opcionesRespuesta.map((opcion) => (
                  <FormControlLabel
                    key={opcion.id}
                    value={opcion.id}
                    control={<Radio />}
                    label={opcion.textoOpcion}
                  />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Footer de Acciones */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          endIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando..." : "Finalizar y Enviar"}
        </Button>
      </Box>
    </Container>
  );
}
