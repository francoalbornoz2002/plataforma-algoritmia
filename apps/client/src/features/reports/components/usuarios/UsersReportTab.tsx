import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import SummaryReportSection from "./SummaryReportSection";
import HistoryReportSection from "./HistoryReportSection";
import ReportSelectorDialog, {
  type ReportOption,
} from "../common/ReportSelectorDialog";

interface Props {
  trigger: number;
}

export default function UsersReportTab({ trigger }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (trigger > 0) setIsDialogOpen(true);
  }, [trigger]);

  const options: ReportOption[] = [
    {
      id: "summary",
      title: "Resumen General",
      description: "Distribución de usuarios por rol y estado.",
      icon: <AssessmentIcon />,
      color: "primary.main",
    },
    {
      id: "history",
      title: "Historial",
      description: "Registro de altas, bajas y movimientos.",
      icon: <HistoryIcon />,
      color: "secondary.main",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {selectedReport ? (
        <>
          {selectedReport === "summary" && <SummaryReportSection />}
          {selectedReport === "history" && <HistoryReportSection />}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }} elevation={1}>
          <AssessmentIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            No se ha seleccionado ningún reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Haz clic en la pestaña "Usuarios" o en el botón de abajo para
            visualizar las estadísticas.
          </Typography>
          <Button variant="contained" onClick={() => setIsDialogOpen(true)}>
            Elegir Reporte
          </Button>
        </Paper>
      )}

      <ReportSelectorDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={setSelectedReport}
        options={options}
      />
    </Box>
  );
}
