import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

interface ReportExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (aPresentarA: string) => void;
  isGenerating?: boolean;
}

export default function ReportExportDialog({
  open,
  onClose,
  onExport,
  isGenerating = false,
}: ReportExportDialogProps) {
  const [aPresentarA, setAPresentarA] = useState("");

  const handleExport = () => {
    onExport(aPresentarA);
  };

  return (
    <Dialog
      open={open}
      onClose={isGenerating ? () => {} : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Exportar Reporte PDF</DialogTitle>
      {isGenerating ? (
        <DialogContent>
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ p: 4 }}
          >
            <CircularProgress />
            <Typography>Generando reporte...</Typography>
          </Stack>
        </DialogContent>
      ) : (
        <>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                El reporte se generará utilizando los filtros aplicados
                actualmente.
              </Alert>

              <TextField
                label="A presentar a (Opcional)"
                placeholder="Ej: Director Académico"
                fullWidth
                value={aPresentarA}
                onChange={(e) => setAPresentarA(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleExport}
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
            >
              Exportar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
