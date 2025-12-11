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
import { deleteSesion } from "../service/sesiones-refuerzo.service";
import type { SesionRefuerzoResumen } from "../../../types";
import { useCourseContext } from "../../../context/CourseContext";

interface DeleteSesionDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
  sesionToDelete: SesionRefuerzoResumen;
}

export default function DeleteSesionDialog({
  open,
  onClose,
  onDeleteSuccess,
  sesionToDelete,
}: DeleteSesionDialogProps) {
  const { selectedCourse } = useCourseContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedCourse) {
      enqueueSnackbar("No hay un curso seleccionado.", { variant: "error" });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSesion(selectedCourse.id, sesionToDelete.id);
      enqueueSnackbar("Sesión cancelada correctamente", { variant: "success" });
      onDeleteSuccess();
      onClose();
    } catch (error: any) {
      const message = error.message || "Error al cancelar la sesión.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Cancelación de Sesión</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que quieres cancelar la{" "}
          <strong>Sesión N° {sesionToDelete.nroSesion}</strong> para el alumno{" "}
          <strong>
            {sesionToDelete.alumno.nombre} {sesionToDelete.alumno.apellido}
          </strong>
          ? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button onClick={handleDelete} color="error" disabled={isDeleting}>
          {isDeleting ? <CircularProgress size={24} /> : "Cancelar Sesión"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
