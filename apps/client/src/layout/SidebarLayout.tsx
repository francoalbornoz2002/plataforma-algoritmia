import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SettingsIcon from "@mui/icons-material/Settings";
import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router";
import {
  AssignmentLate,
  Class,
  Insights,
  LocationCity,
  SwitchAccessShortcutAdd,
} from "@mui/icons-material";
import type { MenuItemType, UserData } from "../types";
import MarkUnreadChatAltIcon from "@mui/icons-material/MarkUnreadChatAlt";

import CourseContextLayout from "./CourseContextLayout";
import { Box, CircularProgress } from "@mui/material"; // Para el 'loading'
import { useAuth } from "../features/authentication/context/AuthProvider";

export default function SidebarLayout() {
  const { user } = useAuth() as { user: UserData | null };

  // --- 1. LISTA DE ADMIN (prefijo /dashboard) ---
  const itemsAdmin: MenuItemType[] = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/dashboard/users" },
    { text: "Cursos", icon: <SchoolIcon />, path: "/dashboard/courses" },
    { text: "Estadísticas", icon: <BarChartIcon />, path: "/dashboard/stats" },
    { text: "Reportes", icon: <AssessmentIcon />, path: "/dashboard/reports" },
    { text: "Auditoría", icon: <VpnKeyIcon />, path: "/dashboard/audit" },
    {
      text: "Datos de la Institución",
      icon: <LocationCity />,
      path: "/dashboard/settings",
    },
    // (La ruta de AccountPage está separada en tu Router,
    // pero si la quieres en el sidebar, añádela aquí)
    // { text: "Mi Cuenta", icon: <AccountCircle />, path: "/dashboard/account" },
  ];

  // --- 2. LISTA DE DOCENTE (prefijo /course) ---
  const itemsDocente = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/course/dashboard" },
    { text: "Progreso", icon: <Insights />, path: "/course/progress" },
    {
      text: "Dificultades",
      icon: <AssignmentLate />,
      path: "/course/difficulties",
    },
    {
      text: "Sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/course/sessions", // (Ruta futura)
    },
    {
      text: "Consultas",
      icon: <MarkUnreadChatAltIcon />,
      path: "/course/consults",
    },
    {
      text: "Clases de consulta",
      icon: <Class />,
      path: "/course/consult-classes",
    },
    {
      text: "Configuración de curso",
      icon: <SettingsIcon />,
      path: "/course/settings-course",
    },
  ];

  // --- 3. LISTA DE ALUMNO (prefijo /my) ---
  const itemsAlumno = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/my/dashboard" },
    {
      text: "Mi progreso",
      icon: <Insights />,
      path: "/my/progress",
    },
    {
      text: "Mis dificultades",
      icon: <AssignmentLate />,
      path: "/my/difficulties",
    },
    {
      text: "Mis sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/my/sessions", // (Ruta futura)
    },
    {
      text: "Mis consultas",
      icon: <MarkUnreadChatAltIcon />,
      path: "/my/consults",
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
        userInitial={(user?.nombre || "U")[0]}
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
