import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import type { ReactNode } from "react";

export interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}

interface ReportSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reportId: string) => void;
  title?: string;
  options: ReportOption[];
}

export default function ReportSelectorDialog({
  open,
  onClose,
  onSelect,
  title = "Selecciona el tipo de reporte",
  options,
}: ReportSelectorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {options.map((option) => (
            <Grid size={{ xs: 12, sm: 6 }} key={option.id}>
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
                  onSelect(option.id);
                  onClose();
                }}
              >
                <Box
                  sx={{
                    color: option.color,
                    display: "flex",
                    mb: 1,
                    "& svg": { fontSize: 48 },
                  }}
                >
                  {option.icon}
                </Box>
                <Typography variant="h6">{option.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
