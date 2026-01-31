import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { format } from "date-fns";
import { estado_sesion } from "../../../../types";
import ResultadoSesionView from "../../../sesiones-refuerzo/components/ResultadoSesionView";

interface Props {
  open: boolean;
  onClose: () => void;
  sesion: any;
}

export default function SesionDetailModal({ open, onClose, sesion }: Props) {
  if (!sesion) return null;

  const isCompleted = sesion.estado === estado_sesion.Completada;
  const resultado = sesion.resultadoSesion;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Detalle de Sesión #{sesion.nroSesion}
        <Typography variant="subtitle2" color="text.secondary">
          {sesion.dificultad.tema} - {sesion.dificultad.nombre}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Alumno
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {sesion.alumno.nombre} {sesion.alumno.apellido}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Asignado por
            </Typography>
            <Typography variant="body2">
              {sesion.docente
                ? `${sesion.docente.nombre} ${sesion.docente.apellido}`
                : "Sistema (Automático)"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Box>
              <Chip
                label={sesion.estado.replace("_", " ")}
                color={
                  isCompleted
                    ? "success"
                    : sesion.estado === "Pendiente"
                      ? "info"
                      : "error"
                }
                size="small"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Fecha Límite
            </Typography>
            <Typography variant="body2">
              {format(new Date(sesion.fechaHoraLimite), "dd/MM/yyyy HH:mm")}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Tiempo Límite
            </Typography>
            <Typography variant="body2">{sesion.tiempoLimite} min</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {isCompleted && resultado ? (
          <ResultadoSesionView sesion={sesion} />
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preguntas de la Sesión
            </Typography>
            <List dense>
              {sesion.preguntas?.map((p: any, index: number) => (
                <ListItem key={p.pregunta.id} divider>
                  <ListItemText
                    primary={`${index + 1}. ${p.pregunta.enunciado}`}
                    secondary={`${p.pregunta.opcionesRespuesta.length} opciones`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
