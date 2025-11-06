// src/auth/RoleProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router";

import { type Rol } from "../../../types/roles";
import { roles } from "../../../types";
import { useAuth } from "../context/AuthProvider";

interface RoleProtectedRouteProps {
  allowedRoles: Rol[];
}

export default function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Si el usuario existe Y su rol está permitido
  if (user && allowedRoles.includes(user.rol)) {
    return <Outlet />; // <-- Permite el acceso
  }

  // Si el usuario existe pero NO tiene el rol
  if (user) {
    console.warn(
      `Acceso denegado a ${location.pathname} para el rol ${user.rol}`
    );

    // --- MEJORA DE UX ---
    // Lo redirigimos a SU dashboard, no al login
    let homeRoute = "/login"; // Fallback por si acaso
    if (user.rol === roles.Administrador) {
      homeRoute = "/dashboard";
    } else if (user.rol === roles.Docente) {
      homeRoute = "/course/dashboard";
    } else if (user.rol === roles.Alumno) {
      homeRoute = "/my/dashboard";
    }

    return <Navigate to={homeRoute} state={{ from: location }} replace />;
  }

  // Si no hay usuario (esto es un fallback, ProtectedRoute ya debería haberlo atajado)
  return <Navigate to="/login" state={{ from: location }} replace />;
}
