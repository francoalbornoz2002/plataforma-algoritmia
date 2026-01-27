import { useState } from "react";
import { useParams } from "react-router";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ClassIcon from "@mui/icons-material/Class";
import SchoolIcon from "@mui/icons-material/School";
import ProgressReportTab from "../components/progreso/ProgressReportTab";
import { useOptionalCourseContext } from "../../../context/CourseContext";
import DifficultiesReportTab from "../components/dificultades/DifficultiesReportTab";
import ConsultasReportTab from "../components/consultas/ConsultasReportTab";
import ClassesReportTab from "../components/clases-consulta/ClassesReportTab";
import SessionsReportTab from "../components/sesiones-refuerzo/SessionsReportTab";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CourseReportsPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const courseContext = useOptionalCourseContext();
  const [value, setValue] = useState(0);

  // Prioridad: 1. Curso del Contexto (Docente) -> 2. ID de la URL (Admin/Link)
  const courseId = courseContext?.selectedCourse?.id || paramId;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (!courseId)
    return <Typography>Curso no encontrado o no seleccionado.</Typography>;

  return (
    <Box sx={{ mx: -3, mt: -3 }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="pestañas reportes curso"
        >
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label="Progreso"
          />
          <Tab
            icon={<WarningIcon />}
            iconPosition="start"
            label="Dificultades"
          />
          <Tab
            icon={<QuestionAnswerIcon />}
            iconPosition="start"
            label="Consultas"
          />
          <Tab
            icon={<ClassIcon />}
            iconPosition="start"
            label="Clases de Consulta"
          />
          <Tab
            icon={<SchoolIcon />}
            iconPosition="start"
            label="Sesiones de Refuerzo"
          />
        </Tabs>
      </Box>

      <CustomTabPanel value={value} index={0}>
        <ProgressReportTab courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <DifficultiesReportTab courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <ConsultasReportTab courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <ClassesReportTab courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        <SessionsReportTab courseId={courseId} />
      </CustomTabPanel>
    </Box>
  );
}
