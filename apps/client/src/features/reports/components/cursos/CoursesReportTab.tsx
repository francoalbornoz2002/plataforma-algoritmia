import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CoursesSummarySection from "./CoursesSummarySection";
import CoursesHistorySection from "./CoursesHistorySection";
import StudentEnrollmentHistorySection from "./StudentEnrollmentHistorySection";
import TeacherAssignmentHistorySection from "./TeacherAssignmentHistorySection";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-report-tabpanel-${index}`}
      aria-labelledby={`course-report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function CoursesReportTab() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", mt: -3 }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          mx: -3,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="secciones reporte cursos"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label="Resumen General"
          />
          <Tab
            icon={<HistoryEduIcon />}
            iconPosition="start"
            label="Historial de Movimientos"
          />
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Historial de Inscripciones (Alumnos)"
          />
          <Tab
            icon={<SchoolIcon />}
            iconPosition="start"
            label="Historial Asignaciones (Docentes)"
          />
        </Tabs>
      </Box>

      {/* Sección 1: Resumen General */}
      <CustomTabPanel value={value} index={0}>
        <CoursesSummarySection />
      </CustomTabPanel>

      {/* Sección 2: Historial Cursos */}
      <CustomTabPanel value={value} index={1}>
        <CoursesHistorySection />
      </CustomTabPanel>

      {/* Sección 3: Historial Alumnos */}
      <CustomTabPanel value={value} index={2}>
        <StudentEnrollmentHistorySection />
      </CustomTabPanel>

      {/* Sección 4: Historial Docentes */}
      <CustomTabPanel value={value} index={3}>
        <TeacherAssignmentHistorySection />
      </CustomTabPanel>
    </Box>
  );
}
