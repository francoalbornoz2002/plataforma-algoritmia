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
      {/* 1. Ruta Pública para Login */}
      <Route path="/login" element={<LoginPage />} />
      {/* 2. Grupo de Rutas Protegidas (Requieren Autenticación) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          {/* 2.1 Grupo de Rutas SOLO para ADMIN (dentro de /dashboard) */}
          {/* RoleProtectedRoute verifica si el rol es ADMIN */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={[Roles.Administrador]} />
            }
          >
            {/* Todas las rutas anidadas aquí requieren ADMIN y usan DashboardLayout */}
            <Route path="users" element={<UsersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="account" element={<AccountPage />} />
            {/* Si agregas más rutas de admin aquí, estarán protegidas */}
          </Route>{" "}
          {/* Fin de rutas protegidas para el rol ADMIN */}
          <Route
            element={<RoleProtectedRoute allowedRoles={[Roles.Docente]} />}
          >
            {/* Todas las rutas anidadas aquí requieren DOCENTE y usan DashboardLayout */}
            {/*<Route path="course/dashboard" element={<DocenteDashboardView />} />*/}
            <Route path="course/progress" element={<ProgressPage />} />
            <Route path="course/difficulties" element={<DifficultiesPage />} />
            {/*<Route path="course/sessions" element={<DashboardPage />} />*/}
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={[Roles.Alumno]} />}>
            {/* Todas las rutas anidadas aquí requieren DOCENTE y usan DashboardLayout */}
            {/*<Route path="my/dashboard" element={<DocenteDashboardView />} />*/}
            <Route path="my/progress" element={<MyProgressPage />} />
            <Route path="my/difficulties" element={<MyDifficultiesPage />} />
            {/*<Route path="my/sessions" element={<DashboardPage />} />*/}
          </Route>
        </Route>{" "}
        {/* Fin del grupo de rutas que usan DashBoardLayout */}
      </Route>{" "}
      {/* Fin del grupo de rutas protegidas por autenticación */}
      {/* 3. Redirección a la Home */}
      <Route path="/" element={<Navigate to="/" replace />} />
      {/* 4. Ruta 404 */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Routes>
  );
};
