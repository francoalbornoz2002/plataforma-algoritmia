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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // ESTADO REFACTORIZADO: Un solo objeto para el resultado final.
  const [finalResultData, setFinalResultData] = useState<{
    sesion: SesionRefuerzoConDetalles;
    nuevoGrado: ResolverSesionResponse["resultados"]["nuevoGrado"];
  } | null>(null);

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

  // --- Scroll to top on result view ---
  useEffect(() => {
    // Cuando los resultados finales están listos, la vista cambia.
    // Hacemos scroll hacia arriba para que el usuario vea el resumen.
    if (finalResultData) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [finalResultData]);

  // --- Lógica del Timer ---
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !finalResultData) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && !finalResultData && !isSubmitting) {
      // Tiempo agotado: Enviar automáticamente
      handleSubmit();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, finalResultData]); // isSubmitting omitido para evitar loops, se controla dentro

  // --- Prevent Accidental Navigation ---
  const isExamInProgress = timeLeft !== null && !finalResultData;

  useEffect(() => {
    if (!isExamInProgress) return;

    // 1. Prevenir recarga o cierre de pestaña
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // 2. Prevenir navegación atrás del navegador
    const handlePopState = () => {
      // Empujamos de nuevo el estado actual para anular la acción de "Atrás"
      window.history.pushState(null, "", window.location.href);
      alert(
        "No puedes volver atrás durante la sesión. Si sales, perderás tu progreso."
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    // Agregamos una entrada al historial para tener un "colchón" que interceptar
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isExamInProgress]);

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
      const resultResponse = await resolverSesion(
        selectedCourse.id,
        sesion.id,
        payload
      );

      // ¡CLAVE! Volvemos a buscar la sesión para obtener los resultados completos
      const updatedSesion = await findSesionById(selectedCourse.id, sesion.id);

      // Actualizamos el estado final en un solo paso para evitar race conditions
      setFinalResultData({
        sesion: updatedSesion,
        nuevoGrado: resultResponse.resultados.nuevoGrado,
      });

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
  }, [sesion, selectedCourse, respuestas, isSubmitting, navigate]);

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeLeft !== null && timeLeft < 60;

  // Keyframes para la animación de parpadeo
  const blinkAnimation = {
    "@keyframes blink": {
      "50%": { backgroundColor: "#d32f2f" }, // Un rojo un poco más oscuro para el parpadeo
    },
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
  if (finalResultData || sesion.estado === estado_sesion.Completada) {
    // Priorizamos los datos frescos del resultado final, si no, usamos los de la sesión cargada.
    const sesionData = finalResultData ? finalResultData.sesion : sesion;
    const nuevoGradoData = finalResultData ? finalResultData.nuevoGrado : null;

    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            ¡Sesión Completada!
          </Typography>
          <Box sx={{ my: 3 }}>
            <ResultadoSesionView
              sesion={sesionData}
              nuevoGrado={nuevoGradoData}
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
          position: "sticky", // Mantiene el elemento fijo durante el scroll
          top: 70, // Aumentado para que sea visible debajo del AppBar principal
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          // Estilos condicionales para cuando el tiempo es crítico
          bgcolor: isTimeCritical ? "error.main" : "background.paper",
          color: isTimeCritical ? "white" : "text.primary",
          transition: "background-color 0.5s ease, color 0.5s ease",
          ...(isTimeCritical && {
            animation: `blink 1.5s infinite`,
          }),
          ...blinkAnimation,
        }}
      >
        <Typography variant="h6">Sesión N° {sesion.nroSesion}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon />
          <Typography
            variant="h5"
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
          onClick={() => setOpenConfirmDialog(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando..." : "Finalizar y Enviar"}
        </Button>
      </Box>

      {/* Dialogo de Confirmación de Envío */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirmar envío</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas finalizar la sesión y enviar tus
            respuestas? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              setOpenConfirmDialog(false);
              handleSubmit();
            }}
            variant="contained"
            autoFocus
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
