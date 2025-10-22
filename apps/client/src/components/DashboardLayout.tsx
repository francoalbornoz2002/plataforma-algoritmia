// src/components/layout/DashboardLayout.tsx
import React from "react";
import Box from "@mui/material/Box";
import Sidebar from "../common/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* El contenido de tus páginas se renderizará aquí */}
        {children}
      </Box>
    </Box>
  );
}
