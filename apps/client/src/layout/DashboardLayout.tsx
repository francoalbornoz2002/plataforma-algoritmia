import { type MenuItemType } from "./sidebar/Sidebar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SettingsIcon from "@mui/icons-material/Settings";
import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import {
  Class,
  QueryStats,
  QuestionAnswer,
  SwitchAccessShortcutAdd,
} from "@mui/icons-material";
import type { UserData } from "../types";

import CourseContextLayout from "./CourseContextLayout";
import { Box, CircularProgress } from "@mui/material"; // Para el 'loading'

export default function DashboardLayout() {
  const { user } = useAuth() as { user: UserData | null };

  const itemsAdmin: MenuItemType[] = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/dashboard/users" },
    { text: "Cursos", icon: <SchoolIcon />, path: "/dashboard/courses" },
    { text: "Estadísticas", icon: <BarChartIcon />, path: "/dashboard/stats" },
    { text: "Reportes", icon: <AssessmentIcon />, path: "/dashboard/reports" },
    { text: "Auditoría", icon: <VpnKeyIcon />, path: "/dashboard/audit" },
    {
      text: "Configuración",
      icon: <SettingsIcon />,
      path: "/dashboard/settings",
    },
  ];
  const itemsDocente = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Progreso", icon: <BarChartIcon />, path: "/dashboard/progress" },
    {
      text: "Dificultades",
      icon: <QueryStats />,
      path: "/dashboard/difficultities",
    },
    {
      text: "Sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/dashboard/sessions",
    },
    {
      text: "Consultas",
      icon: <QuestionAnswer />,
      path: "/dashboard/consults",
    },
    {
      text: "Clases de consulta",
      icon: <Class />,
      path: "/dashboard/consults-classes",
    },
    {
      text: "Configuración de curso",
      icon: <SettingsIcon />,
      path: "/dashboard/settings-course",
    }, // Ejemplo
  ];
  const itemsAlumno = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    {
      text: "Mi progreso",
      icon: <BarChartIcon />,
      path: "/dashboard/my/progress",
    },
    {
      text: "Mis dificultades",
      icon: <QueryStats />,
      path: "/dashboard/my/difficultities",
    },
    {
      text: "Sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/dashboard/my/sessions",
    },
    {
      text: "Consultas",
      icon: <QuestionAnswer />,
      path: "/dashboard/my/consults",
    },
  ];

  // Selecciona el array de items correcto basado en el rol del usuario
  let sidebarItems: MenuItemType[] = [];
  if (user?.rol === "Administrador") {
    sidebarItems = itemsAdmin;
  } else if (user?.rol === "Docente") {
    sidebarItems = itemsDocente;
  } else if (user?.rol === "Alumno") {
    sidebarItems = itemsAlumno;
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 1. Si es Admin, renderiza el layout simple
  if (user.rol === "Administrador") {
    return (
      <Sidebar
        menuItems={sidebarItems}
        userInitial={user.nombre[0]}
        // No pasamos 'onOpenCourseSwitcher', así que el botón no aparecerá
      >
        <Outlet />
      </Sidebar>
    );
  }

  // 2. Si es Docente o Alumno, renderiza el layout "Guardián"
  // (Este componente ya incluye el <Sidebar> y el <Outlet> dentro)
  return (
    <CourseContextLayout menuItems={sidebarItems} user={user}>
      <Outlet />
    </CourseContextLayout>
  );
}
