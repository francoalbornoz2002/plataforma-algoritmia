import React from "react";
import LoginPage from "./features/authentication/pages/LoginPage";
import { Navigate, Route, Routes } from "react-router";
import UsersPage from "./features/users/pages/UsersPage";
import AuditPage from "./features/audit/pages/AuditPage";
import CoursesPage from "./features/courses/pages/CoursesPage";
import AccountPage from "./features/users/pages/AccountPage";
import ProtectedRoute from "./features/authentication/guards/ProtectedRoute";
import RoleProtectedRoute from "./features/authentication/guards/RoleProtectedRoute";
import MyProgressPage from "./features/progress/pages/MyProgressPage";
import DifficultiesPage from "./features/difficulties/pages/DifficultiesPage";
import ProgressPage from "./features/progress/pages/ProgressPage";
import MyDifficultiesPage from "./features/difficulties/pages/MyDifficultiesPage";
import CourseSettingsPage from "./features/courses/pages/CourseSettingsPage";
import SidebarLayout from "./layout/SidebarLayout";
import AdminDashboardPage from "./features/dashboards/AdminDashboardPage";
import DocenteDashboardPage from "./features/dashboards/DocenteDashboardPage";
import AlumnoDashboardPage from "./features/dashboards/AlumnoDashboardPage";
import { Roles } from "./types/roles";
import SettingsPage from "./features/institution/pages/SettingsPage";
import MyConsultsPage from "./features/consultas/pages/MyConsultsPage";
import ConsultasPage from "./features/consultas/pages/ConsultasPage";
import ClasesConsultaPage from "./features/clases-consulta/pages/ClasesConsultaPage";
import PreguntasPage from "./features/preguntas/pages/PreguntasPage";
import SesionesRefuerzoPage from "./features/sesiones-refuerzo/pages/SesionesRefuerzoPage";
import MisSesionesPage from "./features/sesiones-refuerzo/pages/MisSesionesPage";
import SesionResolverPage from "./features/sesiones-refuerzo/pages/SesionResolverPage";
import CourseReportsPage from "./features/reports/pages/CourseReportsPage";
import ReportsPage from "./features/reports/pages/ReportsPage";
import ResetPasswordPage from "./features/authentication/pages/ResetPasswordPage";
import { useAuth } from "./features/authentication/context/AuthProvider";
import ChangePasswordModal from "./features/authentication/components/ChangePasswordModal";
import { ThemeProvider } from "@mui/material";
import { theme } from "./config/theme.config";

export const AppRouter: React.FC<{}> = () => {
  const { mustChangePassword, setMustChangePassword, user } = useAuth();

  return (
    <>
      <Routes>
        {/* 1. Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 2. Grupo de Rutas Protegidas (Autenticación) */}
        <Route element={<ProtectedRoute />}>
          {/* Ruta común para todos, para modificar su cuenta */}
          <Route path="my/account" element={<AccountPage />} />
          {/* GRUPO 1: ADMIN (/dashboard) */}
          {/* Primero validamos el ROL */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={[Roles.Administrador]} />
            }
          >
            {/* Si el ROL es correcto, renderiza este layout
              que a su vez renderiza un <Outlet /> para las páginas */}
            <Route element={<SidebarLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* GRUPO 2: DOCENTE (/course) */}
          {/* Primero validamos el ROL */}
          <Route
            path="/course"
            element={<RoleProtectedRoute allowedRoles={[Roles.Docente]} />}
          >
            {/* Si el ROL es correcto, renderiza el DashboardLayout */}
            <Route element={<SidebarLayout />}>
              <Route path="dashboard" element={<DocenteDashboardPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="difficulties" element={<DifficultiesPage />} />
              <Route path="sessions" element={<SesionesRefuerzoPage />} />
              <Route path="questions" element={<PreguntasPage />} />
              <Route path="consults" element={<ConsultasPage />} />
              <Route path="consult-classes" element={<ClasesConsultaPage />} />
              <Route path="reports" element={<CourseReportsPage />} />
              <Route path="settings" element={<CourseSettingsPage />} />
            </Route>
          </Route>

          {/* GRUPO 3: ALUMNO (/my) */}
          {/* Primero validamos el ROL */}
          <Route
            path="/my"
            element={<RoleProtectedRoute allowedRoles={[Roles.Alumno]} />}
          >
            {/* Si el ROL es correcto, renderiza el DashboardLayout */}
            <Route element={<SidebarLayout />}>
              <Route path="dashboard" element={<AlumnoDashboardPage />} />
              <Route path="progress" element={<MyProgressPage />} />
              <Route path="difficulties" element={<MyDifficultiesPage />} />
              <Route path="sessions" element={<MisSesionesPage />} />
              <Route
                path="sessions/:id/resolver"
                element={<SesionResolverPage />}
              />
              <Route path="consults" element={<MyConsultsPage />} />
            </Route>
          </Route>
        </Route>
        {/* 
          </Route>
        </Route>
      </Route>{" "}
      {/* Fin Rutas Protegidas */}
        {/* 4. Ruta 404 */}
        <Route path="*" element={<div>404 - Página no encontrada</div>} />
      </Routes>

      {/* Modal Global de Cambio de Contraseña (Renderizado aquí para acceder al SnackbarProvider) */}
      <ThemeProvider theme={theme}>
        <ChangePasswordModal
          open={mustChangePassword}
          userId={user?.userId}
          onSuccess={() => setMustChangePassword(false)}
        />
      </ThemeProvider>
    </>
  );
};
