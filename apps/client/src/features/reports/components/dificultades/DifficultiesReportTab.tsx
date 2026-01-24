import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import CourseDifficultiesSummary from "./CourseDifficultiesSummary";
import { Assessment } from "@mui/icons-material";

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
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
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
        </Tabs>
      </Box>
      {tabIndex === 0 && <CourseDifficultiesSummary courseId={courseId} />}
    </Box>
  );
}
