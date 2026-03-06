import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import CourseDifficultiesSummary from "./CourseDifficultiesSummary";
import CourseDifficultiesHistory from "./CourseDifficultiesHistory";
import StudentDifficultiesReport from "./StudentDifficultiesReport";
import { Assessment, History, Person } from "@mui/icons-material";

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
      id={`difficulties-tabpanel-${index}`}
      aria-labelledby={`difficulties-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface Props {
  courseId: string;
}

export default function DifficultiesReportTab({ courseId }: Props) {
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
          mx: -3,
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Assessment />}
            iconPosition="start"
            label="Resumen General"
          />
          <Tab
            icon={<History />}
            iconPosition="start"
            label="Historial de Cambios"
          />
          <Tab icon={<Person />} iconPosition="start" label="Por Alumno" />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <CourseDifficultiesSummary courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <CourseDifficultiesHistory courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <StudentDifficultiesReport courseId={courseId} />
      </CustomTabPanel>
    </Box>
  );
}
