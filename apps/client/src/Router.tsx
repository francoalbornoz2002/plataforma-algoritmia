import React from "react";
import LoginPage from "./features/authentication/pages/LoginPage";
import { Navigate, Route, Routes } from "react-router";
import UsersPage from "./features/users/pages/UsersPage";
import StatsPage from "./features/stats/StatsPage";
import ReportsPage from "./features/reports/ReportsPage";
import AuditPage from "./features/audit/AuditPage";
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
import DocenteDashboardPage from "./features/dashboards/DocenteDashboard";
import AlumnoDashboardPage from "./features/dashboards/AlumnoDashboardPage";
import { Roles } from "./types/roles";

export const AppRouter: React.FC<{}> = () => {
  return (
    <Routes>
      {/* 1. Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* 2. Grupo de Rutas Protegidas (Autenticación) */}
      <Route element={<ProtectedRoute />}>
        {/* Ruta común para todos, para modificar su cuenta */}
        <Route path="my/account" element={<AccountPage />} />
        {/* GRUPO 1: ADMIN (/dashboard) */}
        {/* Primero validamos el ROL */}
        <Route
          path="/dashboard"
          element={<RoleProtectedRoute allowedRoles={[Roles.Administrador]} />}
        >
          {/* Si el ROL es correcto, renderiza este layout
              que a su vez renderiza un <Outlet /> para las páginas */}
          <Route element={<SidebarLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="account" element={<AccountPage />} />
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
          </Route>
        </Route>
      </Route>{" "}
      {/* Fin Rutas Protegidas */}
      {/* 4. Ruta 404 */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Routes>
  );
};
