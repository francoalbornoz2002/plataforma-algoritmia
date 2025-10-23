// src/components/layout/DashboardLayout.tsx
import React from "react";
// Importa el layout modularizado y su tipo de item
import { type MenuItemType } from "./sidebar/Sidebar";

// Importa TODOS los iconos que necesitarás para CUALQUIER rol
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // Icono ejemplo para "Inscribirse"
import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router";

export default function DashboardLayout() {
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
    { text: "Mis Cursos", icon: <SchoolIcon />, path: "/dashboard/my-courses" },
    // Añade aquí otros items específicos para DOCENTE si los tienes
    {
      text: "Configuración",
      icon: <SettingsIcon />,
      path: "/dashboard/settings",
    }, // Ejemplo
  ];

  const itemsAlumno = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Mis Cursos", icon: <SchoolIcon />, path: "/dashboard/my-courses" },
    {
      text: "Inscribirse a Curso",
      icon: <AddCircleOutlineIcon />,
      path: "/dashboard/enroll",
    },
    // Añade aquí otros items específicos para ALUMNO si los tienes
    { text: "Mi Cuenta", icon: <SettingsIcon />, path: "/dashboard/account" }, // Ejemplo
  ];

  return (
    <>
      <Sidebar menuItems={itemsAdmin} userInitial={"A"}>
        {/* El contenido de la página específica (ej. UsersPage, CoursesPage) */}
        {/* se renderizará aquí gracias a la prop 'children' */}
        <Outlet />
      </Sidebar>
    </>
  );
}
