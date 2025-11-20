import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface ActionConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ActionConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  loading = false,
}: ActionConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined} // Bloquea cierre si carga
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="error">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
          disabled={loading}
          autoFocus
        >
          {loading ? "Procesando..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
