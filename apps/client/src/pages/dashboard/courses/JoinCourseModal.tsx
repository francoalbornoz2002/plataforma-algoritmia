import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  DialogContentText,
} from "@mui/material";
import { useState, useEffect } from "react";
// Importamos el servicio de alumno
import { joinCourse } from "../../../services/alumnos.service";
import type { CursoConDetalles } from "../../../types";
import { enqueueSnackbar } from "notistack";
// El tipo de curso que viene de la pestaña "Todos los Cursos"

interface JoinCourseModalProps {
  open: boolean;
  onClose: () => void;
  // El curso al que el alumno intenta unirse
  course: CursoConDetalles;
  // Callback para avisar al modal grande que la inscripción fue exitosa
  onJoinSuccess: () => void;
}

export default function JoinCourseModal({
  open,
  onClose,
  course,
  onJoinSuccess,
}: JoinCourseModalProps) {
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reseteamos el formulario si el modal se abre o se cierra
  // (especialmente si 'open' cambia a 'false')
  useEffect(() => {
    if (!open) {
      // Pequeño delay para que el usuario no vea el reseteo
      setTimeout(() => {
        setPassword("");
        setError(null);
        setIsJoining(false);
      }, 200);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsJoining(true);
    setError(null);

    try {
      // 1. Llamamos al servicio con el ID del curso y la contraseña
      await joinCourse(course.id, password);

      // 2. Si tiene éxito, llamamos al callback
      onJoinSuccess();
      enqueueSnackbar("Inscripción al curso exitosa", {
        variant: "success",
        autoHideDuration: 3000,
      });

      // 3. Cerramos este modal
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al unirse al curso.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Inscribirse a "{course.nombre}"</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Por favor, introduce la contraseña de acceso para unirte a este
            curso.
          </DialogContentText>
          <TextField
            autoFocus
            name="contrasenaAcceso"
            label="Contraseña del Curso"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isJoining}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isJoining}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isJoining}>
            {isJoining ? <CircularProgress size={24} /> : "Unirse"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
