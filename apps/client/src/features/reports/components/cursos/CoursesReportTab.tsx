import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CoursesSummarySection from "./CoursesSummarySection";
import CoursesHistorySection from "./CoursesHistorySection";
import StudentEnrollmentHistorySection from "./StudentEnrollmentHistorySection";
import TeacherAssignmentHistorySection from "./TeacherAssignmentHistorySection";
import ReportSelectorDialog, {
  type ReportOption,
} from "../common/ReportSelectorDialog";

interface Props {
  trigger: number;
}

export default function CoursesReportTab({ trigger }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (trigger > 0) setIsDialogOpen(true);
  }, [trigger]);

  const options: ReportOption[] = [
    {
      id: "summary",
      title: "Resumen General",
      description: "Estado general de todos los cursos.",
      icon: <AssessmentIcon />,
      color: "primary.main",
    },
    {
      id: "history",
      title: "Historial de Cursos",
      description: "Altas, bajas y finalizaciones.",
      icon: <HistoryEduIcon />,
      color: "secondary.main",
    },
    {
      id: "enrollment",
      title: "Inscripciones",
      description: "Historial de alumnos inscriptos.",
      icon: <PersonIcon />,
      color: "info.main",
    },
    {
      id: "assignment",
      title: "Asignaciones",
      description: "Historial de docentes asignados.",
      icon: <SchoolIcon />,
      color: "warning.main",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {selectedReport ? (
        <>
          {selectedReport === "summary" && <CoursesSummarySection />}
          {selectedReport === "history" && <CoursesHistorySection />}
          {selectedReport === "enrollment" && (
            <StudentEnrollmentHistorySection />
          )}
          {selectedReport === "assignment" && (
            <TeacherAssignmentHistorySection />
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }} elevation={1}>
          <SchoolIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No se ha seleccionado ningún reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Haz clic en la pestaña "Cursos" o en el botón para ver las opciones.
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
