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

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  subject?: string;
  warning?: string;
  isLoading?: boolean;
  confirmText?: string;
  error?: string | null;
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  subject,
  warning,
  isLoading = false,
  confirmText = "Confirmar",
  error,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {description}
          {subject && <strong>{subject}</strong>}
          {warning}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" disabled={isLoading}>
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
