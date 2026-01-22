import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CoursesSummarySection from "./CoursesSummarySection";

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
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
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
            label="Historial Cursos"
            disabled // Próximamente
          />
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Historial Alumnos"
            disabled // Próximamente
          />
          <Tab
            icon={<SchoolIcon />}
            iconPosition="start"
            label="Historial Docentes"
            disabled // Próximamente
          />
        </Tabs>
      </Box>

      {/* Sección 1: Resumen General */}
      <CustomTabPanel value={value} index={0}>
        <CoursesSummarySection />
      </CustomTabPanel>

      {/* Sección 2: Historial Cursos (Placeholder) */}
      <CustomTabPanel value={value} index={1}>
        <Typography sx={{ p: 2 }}>
          Próximamente: Historial de altas y bajas de cursos.
        </Typography>
      </CustomTabPanel>

      {/* Sección 3: Historial Alumnos (Placeholder) */}
      <CustomTabPanel value={value} index={2}>
        <Typography sx={{ p: 2 }}>
          Próximamente: Historial de inscripciones y bajas de alumnos.
        </Typography>
      </CustomTabPanel>

      {/* Sección 4: Historial Docentes (Placeholder) */}
      <CustomTabPanel value={value} index={3}>
        <Typography sx={{ p: 2 }}>
          Próximamente: Historial de asignaciones y bajas de docentes.
        </Typography>
      </CustomTabPanel>
    </Box>
  );
}
