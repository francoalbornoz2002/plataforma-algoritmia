import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import { Assessment, History, Person } from "@mui/icons-material";
import CourseDifficultiesSummary from "./CourseDifficultiesSummary";
import CourseDifficultiesHistory from "./CourseDifficultiesHistory";
import StudentDifficultiesReport from "./StudentDifficultiesReport";
import ReportSelectorDialog, {
  type ReportOption,
} from "../common/ReportSelectorDialog";

interface Props {
  courseId: string;
  trigger: number;
}

export default function DifficultiesReportTab({ courseId, trigger }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (trigger > 0) setIsDialogOpen(true);
  }, [trigger]);

  const options: ReportOption[] = [
    {
      id: "summary",
      title: "Resumen General",
      description: "Estado actual de dificultades del curso.",
      icon: <Assessment />,
      color: "error.main",
    },
    {
      id: "history",
      title: "Historial de Cambios",
      description: "Evolución de grados de dificultad.",
      icon: <History />,
      color: "primary.main",
    },
    {
      id: "student",
      title: "Por Alumno",
      description: "Detalle individual de cada alumno.",
      icon: <Person />,
      color: "info.main",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {selectedReport ? (
        <>
          {selectedReport === "summary" && (
            <CourseDifficultiesSummary courseId={courseId} />
          )}
          {selectedReport === "history" && (
            <CourseDifficultiesHistory courseId={courseId} />
          )}
          {selectedReport === "student" && (
            <StudentDifficultiesReport courseId={courseId} />
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }} elevation={1}>
          <Assessment sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No se ha seleccionado ningún reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Haz clic en la pestaña "Dificultades" o en el botón para ver las
            opciones.
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
