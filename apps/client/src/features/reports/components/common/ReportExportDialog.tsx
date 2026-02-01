import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Stack,
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Exportar Reporte PDF</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            El reporte se generará utilizando los filtros aplicados actualmente.
          </Alert>

          <TextField
            label="A presentar a (Opcional)"
            placeholder="Ej: Director Académico"
            fullWidth
            value={aPresentarA}
            onChange={(e) => setAPresentarA(e.target.value)}
            disabled={isGenerating}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isGenerating}>
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          disabled={isGenerating}
        >
          {isGenerating ? "Generando..." : "Exportar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
