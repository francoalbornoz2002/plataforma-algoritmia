import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  Divider,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  LinearProgress,
  Avatar,
  ButtonBase,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import Confetti from "react-confetti";
import { useCourseContext } from "../../../context/CourseContext";
import {
  findSesionById,
  iniciarSesion,
  resolverSesion,
} from "../service/sesiones-refuerzo.service";
import {
  type SesionRefuerzoConDetalles,
  type ResolverSesionResponse,
  grado_dificultad,
  estado_sesion,
} from "../../../types";
import { enqueueSnackbar } from "notistack";
import ResultadoSesionView from "../components/ResultadoSesionView";

export default function SesionResolverPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedCourse } = useCourseContext();
  const navigate = useNavigate();
  const theme = useTheme();

  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [sesion, setSesion] = useState<SesionRefuerzoConDetalles | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [currentSelection, setCurrentSelection] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

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

  // --- Sync Current Selection on Step Change ---
  useEffect(() => {
    if (sesion) {
      const currentQId = sesion.preguntas[activeStep].pregunta.id;
      // Load saved answer or empty if none
      setCurrentSelection(respuestas[currentQId] || "");
    }
  }, [activeStep, sesion, respuestas]);

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

  const handleOptionChange = (idPregunta: string, idOpcion: string) => {
    setCurrentSelection(idOpcion);
  };

  const handleNext = () => {
    if (sesion && activeStep < sesion.preguntas.length - 1) {
      // Save current selection to answers before moving
      if (currentSelection) {
        setRespuestas((prev) => ({
          ...prev,
          [sesion.preguntas[activeStep].pregunta.id]: currentSelection,
        }));
      }
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0 && sesion) {
      // Save current selection to answers before moving
      if (currentSelection && sesion.preguntas[activeStep]) {
        setRespuestas((prev) => ({
          ...prev,
          [sesion.preguntas[activeStep].pregunta.id]: currentSelection,
        }));
      }
      setActiveStep((prev) => prev - 1);
    }
  };

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

  const handleSubmit = useCallback(async () => {
    if (!sesion || !selectedCourse || isSubmitting) return;
    setIsSubmitting(true);

    // Merge current selection into answers (for the last question or timer expiry)
    const finalRespuestas = { ...respuestas };
    const currentQId = sesion.preguntas[activeStep].pregunta.id;
    if (currentSelection) {
      finalRespuestas[currentQId] = currentSelection;
    }

    // Formatear respuestas para el DTO
    const payload = {
      respuestas: Object.entries(finalRespuestas).map(
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
  }, [
    sesion,
    selectedCourse,
    respuestas,
    currentSelection,
    activeStep,
    isSubmitting,
  ]);

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage = useMemo(() => {
    if (!sesion) return 0;
    return (Object.keys(respuestas).length / sesion.preguntas.length) * 100;
  }, [sesion, respuestas]);

  // Lógica para determinar si mostrar el confeti
  const showConfetti = useMemo(() => {
    if (!finalResultData) return false;

    const { gradoAnterior } = finalResultData.sesion.resultadoSesion!;
    const nuevoGrado = finalResultData.nuevoGrado;

    if (gradoAnterior === nuevoGrado) return false;

    // Caso 1: Se superó la dificultad por completo (de cualquier grado a Ninguno)
    if (nuevoGrado === grado_dificultad.Ninguno) {
      return true;
    }

    // Caso 2: El grado bajó (ej. Alto -> Medio)
    const grados = [
      grado_dificultad.Bajo,
      grado_dificultad.Medio,
      grado_dificultad.Alto,
    ];
    const indexAntes = grados.indexOf(gradoAnterior);
    const indexDespues = grados.indexOf(nuevoGrado);

    // Solo comparamos si ambos grados son comparables (no son 'Ninguno' en este punto)
    if (indexAntes > -1 && indexDespues > -1) {
      return indexDespues < indexAntes;
    }

    return false;
  }, [finalResultData]);

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
        {showConfetti && <Confetti recycle={false} />}
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            {showConfetti ? "¡Felicitaciones!" : "¡Sesión Completada!"}
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
    <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
      {/* --- Botón Volver (Arriba Izquierda) --- */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          onClick={() => setOpenCancelDialog(true)}
        >
          Volver a mis sesiones
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* --- Columna Izquierda: Pregunta --- */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Paper elevation={2} sx={{ p: 4, minHeight: 400 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Pregunta {activeStep + 1}
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 4 }}>
              {sesion.preguntas[activeStep].pregunta.enunciado}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <RadioGroup
              value={currentSelection}
              onChange={(e) =>
                handleOptionChange(
                  sesion.preguntas[activeStep].pregunta.id,
                  e.target.value
                )
              }
            >
              {sesion.preguntas[activeStep].pregunta.opcionesRespuesta.map(
                (opcion) => (
                  <FormControlLabel
                    key={opcion.id}
                    value={opcion.id}
                    control={<Radio sx={{ transform: "scale(1.2)" }} />}
                    label={
                      <Typography variant="body1" sx={{ py: 1 }}>
                        {opcion.textoOpcion}
                      </Typography>
                    }
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  />
                )
              )}
            </RadioGroup>
          </Paper>

          {/* Botones de Navegación */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handlePrev}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
            >
              Anterior pregunta
            </Button>

            {activeStep === sesion.preguntas.length - 1 ? (
              <Button
                variant="contained"
                sx={{ width: 185 }}
                onClick={() => {
                  // Save current selection before opening dialog
                  if (currentSelection) {
                    setRespuestas((prev) => ({
                      ...prev,
                      [sesion.preguntas[activeStep].pregunta.id]:
                        currentSelection,
                    }));
                  }
                  setOpenConfirmDialog(true);
                }}
                endIcon={<PlayArrowIcon />}
              >
                Finalizar Sesión
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ width: 185 }}
                onClick={handleNext}
                endIcon={<PlayArrowIcon />}
              >
                Siguiente pregunta
              </Button>
            )}
          </Box>
        </Grid>

        {/* --- Columna Derecha: Sidebar de Progreso --- */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={2} sx={{ position: "sticky", top: 20 }}>
            {/* 1. Paper de Sesión y Tiempo */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Sesión N° {sesion.nroSesion}
                </Typography>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: isTimeCritical
                      ? "rgba(255,255,255,0.5)"
                      : "divider",
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon />
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", fontFamily: "monospace" }}
                  >
                    {formatTime(timeLeft)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* 2. Paper de Progreso */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Progreso
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >{`${Math.round(progressPercentage)}%`}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pregunta {activeStep + 1} de {sesion.preguntas.length}
              </Typography>

              {/* Grid 5 columnas */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 1,
                  justifyItems: "center",
                }}
              >
                {sesion.preguntas.map((p, index) => {
                  const isAnswered = !!respuestas[p.pregunta.id];
                  const isCurrent = index === activeStep;

                  return (
                    <ButtonBase
                      key={p.pregunta.id}
                      onClick={() => setActiveStep(index)}
                      sx={{ borderRadius: "50%" }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: "0.875rem",
                          bgcolor: isCurrent
                            ? "transparent"
                            : isAnswered
                              ? "primary.main"
                              : alpha(theme.palette.grey[400], 0.2),
                          color: isCurrent
                            ? "primary.main"
                            : isAnswered
                              ? "white"
                              : "text.primary",
                          border: isCurrent
                            ? `2px solid ${theme.palette.primary.main}`
                            : "none",
                          fontWeight: isCurrent ? "bold" : "normal",
                          transition: "all 0.2s",
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

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

      {/* Dialogo de Cancelación (Volver) */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
      >
        <DialogTitle>¿Salir de la sesión?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Si sales ahora, la sesión quedará registrada como <b>incompleta</b>{" "}
            y no podrás reanudarla más tarde. ¿Estás seguro de que deseas salir?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Cancelar</Button>
          <Button onClick={() => navigate("/my/sessions")} color="error">
            Salir y Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
