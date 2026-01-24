import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import CourseDifficultiesSummary from "./CourseDifficultiesSummary";

interface Props {
  courseId: string;
}

export default function CourseDifficultiesSection({ courseId }: Props) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabIndex} onChange={handleChange}>
          <Tab label="Resumen General" />
        </Tabs>
      </Box>
      {tabIndex === 0 && <CourseDifficultiesSummary courseId={courseId} />}
    </Box>
  );
}
