import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import CourseDifficultiesSummary from "./CourseDifficultiesSummary";
import CourseDifficultiesHistory from "./CourseDifficultiesHistory";
import StudentDifficultiesReport from "./StudentDifficultiesReport";
import { Assessment, History, Person } from "@mui/icons-material";

interface Props {
  courseId: string;
}

export default function DifficultiesReportTab({ courseId }: Props) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
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
          value={tabIndex}
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
      {tabIndex === 0 && <CourseDifficultiesSummary courseId={courseId} />}
      {tabIndex === 1 && <CourseDifficultiesHistory courseId={courseId} />}
      {tabIndex === 2 && <StudentDifficultiesReport courseId={courseId} />}
    </Box>
  );
}
