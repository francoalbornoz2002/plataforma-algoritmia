import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { Assessment } from "@mui/icons-material";
import CourseProgressSummary from "./CourseProgressSummary";
import CourseMissionsReport from "./CourseMissionsReport";
import CourseMissionDetailReport from "./CourseMissionDetailReport";
import ReportSelectorDialog, {
  type ReportOption,
} from "../common/ReportSelectorDialog";

interface Props {
  courseId: string;
  trigger: number;
}

export default function ProgressReportTab({ courseId, trigger }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (trigger > 0) setIsDialogOpen(true);
  }, [trigger]);

  const options: ReportOption[] = [
    {
      id: "summary",
      title: "Resumen General",
      description: "Vista general del progreso del curso.",
      icon: <Assessment />,
      color: "primary.main",
    },
    {
      id: "missions",
      title: "Misiones Completadas",
      description: "Métricas de misiones superadas.",
      icon: <ListAltIcon />,
      color: "success.main",
    },
    {
      id: "detail",
      title: "Detalle por Misión",
      description: "Análisis profundo de una misión.",
      icon: <AssignmentIcon />,
      color: "warning.main",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {selectedReport ? (
        <>
          {selectedReport === "summary" && (
            <CourseProgressSummary courseId={courseId} />
          )}
          {selectedReport === "missions" && (
            <CourseMissionsReport courseId={courseId} />
          )}
          {selectedReport === "detail" && (
            <CourseMissionDetailReport courseId={courseId} />
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }} elevation={1}>
          <Assessment sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No se ha seleccionado ningún reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Haz clic en la pestaña "Progreso" o en el botón para ver las
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
