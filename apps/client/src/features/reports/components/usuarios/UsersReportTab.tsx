import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import SummaryReportSection from "./SummaryReportSection";
import HistoryReportSection from "./HistoryReportSection";

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
      id={`users-report-tabpanel-${index}`}
      aria-labelledby={`users-report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UsersReportTab() {
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
          bgcolor: "background.paper",
          mx: -3,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="secciones reporte usuarios"
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
            label="Historial de Movimientos"
          />
        </Tabs>
      </Box>

      {/* Sección 1: Resumen */}
      <CustomTabPanel value={value} index={0}>
        <SummaryReportSection />
      </CustomTabPanel>

      {/* Sección 2: Historial */}
      <CustomTabPanel value={value} index={1}>
        <HistoryReportSection />
      </CustomTabPanel>
    </Box>
  );
}
