import React from "react";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router";

export const AppRouter: React.FC<{}> = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
