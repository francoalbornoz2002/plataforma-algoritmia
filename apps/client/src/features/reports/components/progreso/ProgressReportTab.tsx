import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CourseProgressSummary from "./CourseProgressSummary";
import CourseMissionsReport from "./CourseMissionsReport";
import CourseMissionDetailReport from "./CourseMissionDetailReport";
import { Assessment } from "@mui/icons-material";
import { useAuth } from "../../../../features/authentication/context/AuthProvider";
import { roles } from "../../../../types";

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
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface Props {
  courseId: string;
}

export default function ProgressReportTab({ courseId }: Props) {
  const [value, setValue] = useState(0);
  const { profile } = useAuth();
  const isAdmin = profile?.rol === roles.Administrador;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", mt: -3 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {isAdmin && (
            <Tab
              icon={<Assessment />}
              iconPosition="start"
              label="Resumen General"
            />
          )}
          <Tab
            icon={<ListAltIcon />}
            iconPosition="start"
            label="Misiones Completadas"
          />
          <Tab
            icon={<AssignmentIcon />}
            iconPosition="start"
            label="Detalle por Misión"
          />
        </Tabs>
      </Box>

      {isAdmin && (
        <CustomTabPanel value={value} index={0}>
          <CourseProgressSummary courseId={courseId} />
        </CustomTabPanel>
      )}
      <CustomTabPanel value={value} index={isAdmin ? 1 : 0}>
        <CourseMissionsReport courseId={courseId} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={isAdmin ? 2 : 1}>
        <CourseMissionDetailReport courseId={courseId} />
      </CustomTabPanel>
    </Box>
  );
}
