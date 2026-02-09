import { useState } from "react";
import { Box, Tab, Tabs, Button } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import UsersReportTab from "../components/usuarios/UsersReportTab";
import CoursesReportTab from "../components/cursos/CoursesReportTab";
import AuditPage from "../../audit/pages/AuditPage";
import ReportContextDialog from "../components/ReportContextDialog";
import CourseReportsView from "../components/CourseReportsView";

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportsPage() {
  const [value, setValue] = useState(0);

  // Estados para el manejo de contexto (General vs Curso)
  const [viewMode, setViewMode] = useState<"general" | "course">("general");
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(true); // Abrir al inicio por defecto

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Handlers para el diálogo
  const handleSelectGeneral = () => {
    setViewMode("general");
    setSelectedCourse(null);
  };

  const handleSelectCourse = (course: { id: string; nombre: string }) => {
    setViewMode("course");
    setSelectedCourse(course);
  };

  // Botón reutilizable
  const changeViewButton = (
    <Button
      variant="outlined"
      startIcon={<SwapHorizIcon />}
      onClick={() => setIsDialogOpen(true)}
      sx={{ mr: 2, my: 1 }}
    >
      Cambiar Vista
    </Button>
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* VISTA GENERAL */}
      {viewMode === "general" && (
        <>
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
              aria-label="pestañas de reportes"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<GroupIcon />} iconPosition="start" label="Usuarios" />
              <Tab icon={<SchoolIcon />} iconPosition="start" label="Cursos" />
              <Tab
                icon={<VpnKeyIcon />}
                iconPosition="start"
                label="Auditoría"
              />
            </Tabs>
            {changeViewButton}
          </Box>
          <CustomTabPanel value={value} index={0}>
            <UsersReportTab />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <CoursesReportTab />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <AuditPage />
          </CustomTabPanel>
        </>
      )}

      {/* VISTA POR CURSO */}
      {viewMode === "course" && selectedCourse && (
        <CourseReportsView
          courseId={selectedCourse.id}
          headerAction={changeViewButton}
        />
      )}

      {/* DIÁLOGO DE SELECCIÓN */}
      <ReportContextDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelectGeneral={handleSelectGeneral}
        onSelectCourse={handleSelectCourse}
      />
    </Box>
  );
}
