import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./index.css";
import App from "./App.tsx";
import { ThemeConfig } from "./config/theme.config.tsx";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./auth/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeConfig>
          <App />
        </ThemeConfig>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
