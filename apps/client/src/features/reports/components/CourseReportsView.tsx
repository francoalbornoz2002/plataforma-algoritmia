import { useState } from "react";
import { Box, Tab, Tabs, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import {
  Assessment,
  AssignmentLate,
  MarkUnreadChatAlt,
  SwitchAccessShortcutAdd,
} from "@mui/icons-material";

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  const [tabTriggers, setTabTriggers] = useState<Record<number, number>>({});

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Al cambiar de pestaña, también disparamos la apertura del modal selector
    setTabTriggers((prev) => ({
      ...prev,
      [newValue]: (prev[newValue] || 0) + 1,
    }));
  };

  const handleTabClick = (index: number) => {
    if (value === index) {
      setTabTriggers((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    }
  };

  const renderTabLabel = (text: string, index: number) => (
    <Tooltip
      title={value === index ? "Clic para cambiar reporte" : ""}
      placement="top"
    >
      <span style={{ display: "flex", alignItems: "center" }}>
        {text}
        {value === index && (
          <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
        )}
      </span>
    </Tooltip>
  );

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
            icon={<Assessment />}
            iconPosition="start"
            label={renderTabLabel("Progreso", 0)}
            onClick={() => handleTabClick(0)}
          />
          <Tab
            icon={<AssignmentLate />}
            iconPosition="start"
            label={renderTabLabel("Dificultades", 1)}
            onClick={() => handleTabClick(1)}
          />
          <Tab
            icon={<MarkUnreadChatAlt />}
            iconPosition="start"
            label={renderTabLabel("Consultas", 2)}
            onClick={() => handleTabClick(2)}
          />
          <Tab
            icon={<ClassIcon />}
            iconPosition="start"
            label={renderTabLabel("Clases de Consulta", 3)}
            onClick={() => handleTabClick(3)}
          />
          <Tab
            icon={<SwitchAccessShortcutAdd />}
            iconPosition="start"
            label={renderTabLabel("Sesiones de Refuerzo", 4)}
            onClick={() => handleTabClick(4)}
          />
        </Tabs>
        {headerAction}
      </Box>

      <CustomTabPanel value={value} index={0}>
        <ProgressReportTab courseId={courseId} trigger={tabTriggers[0] || 0} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <DifficultiesReportTab
          courseId={courseId}
          trigger={tabTriggers[1] || 0}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <ConsultasReportTab courseId={courseId} trigger={tabTriggers[2] || 0} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <ClassesReportTab courseId={courseId} trigger={tabTriggers[3] || 0} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        <SessionsReportTab courseId={courseId} trigger={tabTriggers[4] || 0} />
      </CustomTabPanel>
    </Box>
  );
}
