import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { format } from "date-fns";
import { estado_sesion, temas } from "../../../../types";
import { TemasLabels } from "../../../../types/traducciones";
import ResultadoSesionView from "../../../sesiones-refuerzo/components/ResultadoSesionView";
import PreguntaAccordion from "../../../preguntas/components/PreguntaAccordion";
import EstadoSesionChip from "../../../sesiones-refuerzo/components/EstadoSesionChip";
import { findSesionById } from "../../../sesiones-refuerzo/service/sesiones-refuerzo.service";

interface Props {
  open: boolean;
  onClose: () => void;
  sesion: any;
  courseId?: string;
}

export default function SesionDetailModal({
  open,
  onClose,
  sesion,
  courseId,
}: Props) {
  const [fullSesion, setFullSesion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && sesion) {
      setLoading(true);
      setError(null);
      // Usamos el courseId explícito si se pasa, si no, el del objeto sesión.
      const idCurso = courseId || sesion.idCurso;
      findSesionById(idCurso, sesion.id)
        .then((data) => setFullSesion(data))
        .catch(() => setError("No se pudo cargar el detalle de la sesión."))
        .finally(() => setLoading(false));
    } else {
      // Limpiamos al cerrar para que no muestre datos viejos brevemente
      setFullSesion(null);
    }
  }, [open, sesion, courseId]);

  if (!sesion) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!fullSesion) {
      // Puede pasar si la petición aún no termina o si se cierra el modal
      return null;
    }

    // A partir de aquí, usamos `fullSesion` que tiene todos los datos
    const isCompletedOrIncomplete =
      fullSesion.estado === estado_sesion.Completada ||
      fullSesion.estado === estado_sesion.Incompleta;
    const resultado = fullSesion.resultadoSesion;

    return (
      <>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Alumno
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {fullSesion.alumno.nombre} {fullSesion.alumno.apellido}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Asignado por
            </Typography>
            <Typography variant="body2">
              {fullSesion.docente
                ? `${fullSesion.docente.nombre} ${fullSesion.docente.apellido}`
                : "Sistema (Automático)"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Box>
              <EstadoSesionChip estado={fullSesion.estado} />
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Fecha Límite
            </Typography>
            <Typography variant="body2">
              {format(new Date(fullSesion.fechaHoraLimite), "dd/MM/yyyy HH:mm")}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Tiempo Límite
            </Typography>
            <Typography variant="body2">
              {fullSesion.tiempoLimite} min
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {isCompletedOrIncomplete && resultado ? (
          <ResultadoSesionView sesion={fullSesion} />
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preguntas de la Sesión
            </Typography>
            <Stack spacing={1}>
              {fullSesion.preguntas?.map((p: any) => {
                const preguntaAdaptada = {
                  ...p.pregunta,
                  dificultad: fullSesion.dificultad,
                  docenteCreador: p.pregunta.idDocente
                    ? { nombre: "Docente", apellido: "" }
                    : null,
                };
                return (
                  <PreguntaAccordion
                    key={p.pregunta.id}
                    pregunta={preguntaAdaptada}
                  />
                );
              })}
              {(!fullSesion.preguntas || fullSesion.preguntas.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No hay preguntas asignadas a esta sesión.
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Detalle de Sesión #{sesion.nroSesion}
        <Typography variant="subtitle2" color="text.secondary">
          {TemasLabels[sesion.dificultad.tema as temas] ||
            sesion.dificultad.tema}{" "}
          - {sesion.dificultad.nombre}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>{renderContent()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
