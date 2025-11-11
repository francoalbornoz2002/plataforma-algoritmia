import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import type { ClaseConsulta } from "../../../types";
import { deleteClaseConsulta } from "../services/clases-consulta.service"; // Importamos el servicio

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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteClaseConsulta(clase.id);
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
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Confirmar Cancelación</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que querés cancelar la clase: "{clase.nombre}"? Esta
          acción marcará la clase como 'Cancelada' y devolverá las consultas
          asociadas a 'Pendiente'.
        </DialogContentText>
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
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={24} /> : "Sí, Cancelar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
