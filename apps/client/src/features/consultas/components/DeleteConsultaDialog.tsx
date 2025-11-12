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
import type { Consulta } from "../../../types";
import { deleteConsulta } from "../../users/services/alumnos.service";
import { enqueueSnackbar } from "notistack";

interface DeleteConsultaDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void; // Para refrescar la lista
  consultaToDelete: Consulta;
}

export default function DeleteConsultaDialog({
  open,
  onClose,
  onDeleteSuccess,
  consultaToDelete,
}: DeleteConsultaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      // Llamamos al servicio de borrado
      await deleteConsulta(consultaToDelete.id);
      enqueueSnackbar("Consulta dada de baja correctamente", {
        variant: "success",
      });
      onDeleteSuccess(); // Refresca la lista
      onClose(); // Cierra el modal
    } catch (err: any) {
      setError(err.message || "Error al borrar la consulta.");
      enqueueSnackbar(err.message || "Error al dar de baja la consulta.", {
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Borrado</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que querés borrar tu consulta: "
          {consultaToDelete.titulo}"? Esta acción no se puede deshacer.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="error"
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={24} /> : "Borrar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
