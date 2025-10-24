import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute() {
  // Obtiene el estado de autenticación y carga desde el contexto
  const { isAuthenticated, isLoading } = useAuth();

  // Obtiene la ubicación actual para redirigir después del login
  const location = useLocation();

  // Muestra un estado de carga mientras se verifica el token inicial
  // Esto evita redirigir al login brevemente si el token es válido
  if (isLoading) {
    // Puedes reemplazar esto con un componente Spinner de MUI si lo prefieres
    return <div>Verificando sesión...</div>;
  }

  // Si no está autenticado (y ya no está cargando), redirige al login
  if (!isAuthenticated) {
    console.log("Usuario no autenticado, redirigiendo a login...");
    // Redirige a /login, guardando la ruta original en 'state.from'
    // 'replace' evita que la ruta actual quede en el historial del navegador
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, permite el acceso y renderiza el componente
  // de la ruta anidada (la página real) a través de <Outlet />
  return <Outlet />;
}
