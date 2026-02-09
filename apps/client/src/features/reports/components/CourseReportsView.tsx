import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ClassIcon from "@mui/icons-material/Class";
import SchoolIcon from "@mui/icons-material/School";

// Importamos los componentes de las pestañas (asumiendo que existen en la ruta relativa correcta desde aquí)
import ProgressReportTab from "./progreso/ProgressReportTab";
import DifficultiesReportTab from "./dificultades/DifficultiesReportTab";
import ConsultasReportTab from "./consultas/ConsultasReportTab";
import ClassesReportTab from "./clases-consulta/ClassesReportTab";
import SessionsReportTab from "./sesiones-refuerzo/SessionsReportTab";

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

interface CourseReportsViewProps {
  courseId: string;
  headerAction?: React.ReactNode;
}

export default function CourseReportsView({
  courseId,
  headerAction,
}: CourseReportsViewProps) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
        {headerAction}
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
