import { useState } from "react";
import type { Consulta } from "../../../types";
import { deleteConsulta } from "../../users/services/alumnos.service";
import { enqueueSnackbar } from "notistack";
import ConfirmationDialog from "../../../components/ConfirmationDialog";

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
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirmDelete}
      title="Confirmar Borrado"
      description='¿Estás seguro de que querés borrar tu consulta: "'
      subject={consultaToDelete.titulo}
      warning='"? Esta acción no se puede deshacer.'
      isLoading={isDeleting}
      confirmText="Borrar"
      error={error}
    />
  );
}
