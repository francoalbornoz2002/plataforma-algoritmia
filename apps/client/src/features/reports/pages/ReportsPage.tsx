import { useState } from "react";
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import HistoryIcon from "@mui/icons-material/History";
import UsersReportTab from "../components/UsersReportTab";
import CoursesReportTab from "../components/CoursesReportTab";

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportsPage() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reportes y Estadísticas
        </Typography>
        <Typography variant="body1">
          Genera reportes detallados para analizar el rendimiento de la
          plataforma.
        </Typography>
      </Box>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="pestañas de reportes"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<GroupIcon />} iconPosition="start" label="Usuarios" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="Cursos" />
            <Tab
              icon={<HistoryIcon />}
              iconPosition="start"
              label="Historial de Exportaciones"
              disabled
            />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <UsersReportTab />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <CoursesReportTab />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography>
              Historial de reportes generados (Próximamente)
            </Typography>
          </Box>
        </CustomTabPanel>
      </Paper>
    </Box>
  );
}
