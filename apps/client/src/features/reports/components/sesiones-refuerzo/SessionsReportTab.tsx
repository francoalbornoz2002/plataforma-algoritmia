import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import CourseSessionsSummary from "./CourseSessionsSummary";
import CourseSessionsHistory from "./CourseSessionsHistory";
import ReportSelectorDialog, {
  type ReportOption,
} from "../common/ReportSelectorDialog";

interface Props {
  courseId: string;
  trigger: number;
}

export default function SessionsReportTab({ courseId, trigger }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (trigger > 0) setIsDialogOpen(true);
  }, [trigger]);

  const options: ReportOption[] = [
    {
      id: "summary",
      title: "Resumen General",
      description: "Efectividad de sesiones.",
      icon: <AssessmentIcon />,
      color: "#9c27b0",
    },
    {
      id: "history",
      title: "Historial Detallado",
      description: "Registro completo de sesiones.",
      icon: <HistoryIcon />,
      color: "secondary.main",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {selectedReport ? (
        <>
          {selectedReport === "summary" && (
            <CourseSessionsSummary courseId={courseId} />
          )}
          {selectedReport === "history" && (
            <CourseSessionsHistory courseId={courseId} />
          )}
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
            Haz clic en la pestaña "Sesiones de Refuerzo" o en el botón para ver
            las opciones.
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
