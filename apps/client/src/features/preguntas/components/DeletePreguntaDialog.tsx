import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { enqueueSnackbar } from "notistack";
import { preguntasService } from "../service/preguntas.service";
import type { PreguntaConDetalles } from "../../../types";

interface DeletePreguntaDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
  preguntaToDelete: PreguntaConDetalles;
}

export default function DeletePreguntaDialog({
  open,
  onClose,
  onDeleteSuccess,
  preguntaToDelete,
}: DeletePreguntaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await preguntasService.remove(preguntaToDelete.id);
      enqueueSnackbar("Pregunta dada de baja correctamente", {
        variant: "success",
      });
      onDeleteSuccess();
      onClose();
    } catch (error: any) {
      const message = error.message || "Error al dar de baja la pregunta.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Baja de Pregunta</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que quieres dar de baja la pregunta "
          <strong>{preguntaToDelete.enunciado}</strong>"? Esta acción no se
          puede deshacer. La pregunta ya no estará disponible para nuevas
          sesiones de refuerzo.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button onClick={handleDelete} color="error" disabled={isDeleting}>
          {isDeleting ? <CircularProgress size={24} /> : "Dar de Baja"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
