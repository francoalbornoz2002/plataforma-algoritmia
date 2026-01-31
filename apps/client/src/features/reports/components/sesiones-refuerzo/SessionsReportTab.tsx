import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CourseSessionsSummary from "./CourseSessionsSummary";
import HistoryIcon from "@mui/icons-material/History";
import CourseSessionsHistory from "./CourseSessionsHistory";

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
      id={`sesiones-tabpanel-${index}`}
      aria-labelledby={`sesiones-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface Props {
  courseId: string;
}

export default function SessionsReportTab({ courseId }: Props) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", mt: -3 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label="Resumen General"
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="Historial Detallado"
          />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <CourseSessionsSummary courseId={courseId} />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        <CourseSessionsHistory courseId={courseId} />
      </CustomTabPanel>
    </Box>
  );
}
