import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router";
import {
  Assessment,
  Assignment,
  AssignmentLate,
  Class,
  Dashboard,
  MarkUnreadChatAlt,
  People,
  QueryStats,
  Quiz,
  School,
  SwitchAccessShortcutAdd,
} from "@mui/icons-material";
import type { MenuItemType } from "../types";

import CourseContextLayout from "./CourseContextLayout";
import { Box, CircularProgress } from "@mui/material"; // Para el 'loading'
import { useAuth } from "../features/authentication/context/AuthProvider";

export default function SidebarLayout() {
  const { user, profile } = useAuth(); // Usamos 'profile' que tiene los datos completos
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // --- 1. LISTA DE ADMIN (prefijo /dashboard) ---
  const itemsAdmin: MenuItemType[] = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Usuarios", icon: <People />, path: "/dashboard/users" },
    { text: "Cursos", icon: <School />, path: "/dashboard/courses" },
    {
      text: "Reportes y estadísticas",
      icon: <Assignment />,
      path: "/dashboard/reports",
    },
  ];

  // --- 2. LISTA DE DOCENTE (prefijo /course) ---
  const itemsDocente = [
    { text: "Dashboard", icon: <Dashboard />, path: "/course/dashboard" },
    { text: "Progreso", icon: <Assessment />, path: "/course/progress" },
    {
      text: "Dificultades",
      icon: <AssignmentLate />,
      path: "/course/difficulties",
    },
    {
      text: "Sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/course/sessions",
    },
    {
      text: "Preguntas para sesiones",
      icon: <Quiz />,
      path: "/course/questions",
    },
    {
      text: "Consultas",
      icon: <MarkUnreadChatAlt />,
      path: "/course/consults",
    },
    {
      text: "Clases de consulta",
      icon: <Class />,
      path: "/course/consult-classes",
    },
    {
      text: "Reportes y estadísticas",
      icon: <Assignment />,
      path: "/course/reports",
    },
  ];

  // --- 3. LISTA DE ALUMNO (prefijo /my) ---
  const itemsAlumno = [
    { text: "Dashboard", icon: <Dashboard />, path: "/my/dashboard" },
    {
      text: "Progreso",
      icon: <Assessment />,
      path: "/my/progress",
    },
    {
      text: "Dificultades",
      icon: <AssignmentLate />,
      path: "/my/difficulties",
    },
    {
      text: "Sesiones de refuerzo",
      icon: <SwitchAccessShortcutAdd />,
      path: "/my/sessions", // (Ruta futura)
    },
    {
      text: "Consultas",
      icon: <MarkUnreadChatAlt />,
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
        userInitial={(profile?.nombre || "U")[0]}
        userPhotoUrl={
          profile?.fotoPerfilUrl ? `${baseUrl}${profile.fotoPerfilUrl}` : null
        }
        // No pasamos 'onOpenCourseSwitcher', así que el botón no aparecerá
      >
        <Outlet />
      </Sidebar>
    );
  }

  // 2. Si es Docente o Alumno, renderiza el layout "Guardián"
  // (Este componente ya incluye el <Sidebar> y el <Outlet> dentro)
  return (
    <CourseContextLayout
      menuItems={sidebarItems}
      user={profile || (user as any)} // Pasamos profile preferentemente
      userPhotoUrl={
        profile?.fotoPerfilUrl ? `${baseUrl}${profile.fotoPerfilUrl}` : null
      }
    >
      <Outlet />
    </CourseContextLayout>
  );
}
