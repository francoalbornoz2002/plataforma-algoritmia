// src/components/auth/RoleProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import { type Rol } from "../types/roles";

interface RoleProtectedRouteProps {
  allowedRoles: Rol[];
}

export default function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // La comparación funciona igual porque user.rol es un string
  if (user && allowedRoles.includes(user.rol)) {
    return <Outlet />;
  } else {
    console.warn(
      `Acceso denegado a ${location.pathname} para el rol ${user?.rol}`
    );
    return <Navigate to="/" state={{ from: location }} replace />;
  }
}
