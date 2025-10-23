import React from "react";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router";
import DashboardLayout from "./common/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import StatsPage from "./pages/StatsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AuditPage from "./pages/AuditPage";
import CoursesPage from "./pages/CoursesPage";
import AccountPage from "./pages/AccountPage";

export const AppRouter: React.FC<{}> = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
