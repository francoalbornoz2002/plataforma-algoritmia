import React from "react";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router";
import DashboardLayout from "./common/DashboardLayout";

export const AppRouter: React.FC<{}> = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
