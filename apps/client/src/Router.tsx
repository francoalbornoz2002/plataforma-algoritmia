import React from "react";
import LoginPage from "./pages/login/LoginPage";
import { Navigate, Route, Routes } from "react-router";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/dashboard/users/UsersPage";
import StatsPage from "./pages/dashboard/stats/StatsPage";
import ReportsPage from "./pages/dashboard/reports/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AuditPage from "./pages/dashboard/audit/AuditPage";
import CoursesPage from "./pages/dashboard/courses/CoursesPage";
import AccountPage from "./pages/AccountPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleProtectedRoute from "./auth/RoleProtectedRoute";
import { Roles } from "./types/roles";
import ProgressPage from "./pages/docente/ProgressPage";
import MyProgressPage from "./pages/alumno/MyProgressPage";
import MyDifficultiesPage from "./pages/alumno/MyDifficultiesPage";
import DifficultiesPage from "./pages/docente/DifficultiesPage";

export const AppRouter: React.FC<{}> = () => {
  return (
    <Routes>
      {/* 1. Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* 2. Grupo de Rutas Protegidas (Autenticación) */}
      <Route element={<ProtectedRoute />}>
        {/* GRUPO 1: ADMIN (/dashboard) */}
        {/* Primero validamos el ROL */}
        <Route
          path="/dashboard"
          element={<RoleProtectedRoute allowedRoles={[Roles.Administrador]} />}
        >
          {/* Si el ROL es correcto, renderiza este layout
              que a su vez renderiza un <Outlet /> para las páginas */}
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />
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
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="difficulties" element={<DifficultiesPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
        </Route>

        {/* GRUPO 3: ALUMNO (/my) */}
        {/* Primero validamos el ROL */}
        <Route
          path="/my"
          element={<RoleProtectedRoute allowedRoles={[Roles.Alumno]} />}
        >
          {/* Si el ROL es correcto, renderiza el DashboardLayout */}
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="progress" element={<MyProgressPage />} />
            <Route path="difficulties" element={<MyDifficultiesPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
        </Route>
      </Route>{" "}
      {/* Fin Rutas Protegidas */}
      {/* 4. Ruta 404 */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Routes>
  );
};
