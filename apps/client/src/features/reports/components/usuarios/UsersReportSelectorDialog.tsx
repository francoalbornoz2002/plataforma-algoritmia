import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";

interface UsersReportSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reportType: "summary" | "history") => void;
}

export default function UsersReportSelectorDialog({
  open,
  onClose,
  onSelect,
}: UsersReportSelectorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Selecciona el tipo de reporte</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Tarjeta de Resumen */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                onSelect("summary");
                onClose();
              }}
            >
              <AssessmentIcon
                sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
              />
              <Typography variant="h6">Resumen General</Typography>
              <Typography variant="body2" color="text.secondary">
                Distribución de usuarios por rol y estado.
              </Typography>
            </Paper>
          </Grid>

          {/* Tarjeta de Historial */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                onSelect("history");
                onClose();
              }}
            >
              <HistoryIcon
                sx={{ fontSize: 48, color: "secondary.main", mb: 1 }}
              />
              <Typography variant="h6">Historial</Typography>
              <Typography variant="body2" color="text.secondary">
                Registro de altas, bajas y movimientos.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
