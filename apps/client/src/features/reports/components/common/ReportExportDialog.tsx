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
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";

interface ReportExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (aPresentarA: string) => void;
  isGenerating?: boolean;
  pdfUrl?: string | null;
  fileName?: string;
  title?: string;
}

export default function ReportExportDialog({
  open,
  onClose,
  onExport,
  isGenerating = false,
  pdfUrl,
  fileName = "reporte.pdf",
  title,
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
      <DialogTitle>{title || "Exportar Reporte PDF"}</DialogTitle>
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
      ) : pdfUrl ? (
        <>
          <DialogContent>
            <Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ width: "100%" }}>
                Reporte generado correctamente.
              </Alert>
              <Typography variant="body2" color="text.secondary" align="center">
                El documento está listo. Elija una opción:
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ flexDirection: "column", gap: 1, pb: 3, px: 3 }}>
            <Button
              variant="contained"
              color="primary"
              href={pdfUrl}
              target="_blank"
              fullWidth
              startIcon={<VisibilityIcon />}
            >
              Abrir PDF
            </Button>
            <Button
              variant="outlined"
              color="primary"
              href={pdfUrl}
              download={fileName}
              fullWidth
              startIcon={<DownloadIcon />}
            >
              Descargar PDF
            </Button>
            <Button onClick={onClose} color="inherit" fullWidth sx={{ mt: 1 }}>
              Cerrar
            </Button>
          </DialogActions>
        </>
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
              Generar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
