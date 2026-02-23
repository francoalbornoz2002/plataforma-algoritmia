import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { useState } from "react";
import type { ClaseConsulta } from "../../../types";
import { deleteClaseConsulta } from "../services/clases-consulta.service"; // Importamos el servicio
import { enqueueSnackbar } from "notistack";

interface DeleteClaseDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void; // Para refrescar la lista
  clase: ClaseConsulta;
}

export default function DeleteClaseDialog({
  open,
  onClose,
  onDeleteSuccess,
  clase,
}: DeleteClaseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const handleConfirmDelete = async () => {
    if (!motivo.trim()) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteClaseConsulta(clase.id, motivo);
      enqueueSnackbar("Clase cancelada correctamente", {
        variant: "success",
      });
      onDeleteSuccess(); // Refresca la lista
      onClose(); // Cierra el modal
    } catch (err: any) {
      setError(err.message || "Error al cancelar la clase.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reseteamos el error al cerrar
  const handleClose = () => {
    onClose();
    setError(null);
    setMotivo("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Cancelación</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          ¿Estás seguro de que querés cancelar la clase: "{clase.nombre}"? Esta
          acción marcará la clase como 'Cancelada' y devolverá las consultas
          asociadas a 'Pendiente'.
        </DialogContentText>

        <TextField
          autoFocus
          margin="dense"
          label="Motivo de cancelación"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Indica la razón por la cual se cancela la clase (ej: Enfermedad, Paro de transporte, etc.)"
          helperText="El motivo es obligatorio y será notificado a los alumnos."
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>
          No, mantener
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="error"
          variant="contained"
          disabled={isDeleting || !motivo.trim()}
        >
          {isDeleting ? <CircularProgress size={24} /> : "Sí, Cancelar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
