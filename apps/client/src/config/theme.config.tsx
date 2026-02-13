import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type { JSX } from "react";

type ThemeProp = {
  children: JSX.Element;
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#162660",
    },
    secondary: {
      main: "#D0E6FD",
    },
    text: {
      primary: "rgba(4,4,4,0.8)",
    },
    error: {
      main: "#c62828",
    },
    warning: {
      main: "#fb8c00",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "0.7em",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "0.7em",
          backgroundColor: "#ffffff",
          "&.Mui-disabled": {
            backgroundColor: "#f5f5f5", // Color gris claro para el estado deshabilitado
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "0.7em",
        },
      },
    },
  },
});

export const datePickerConfig = {
  slotProps: {
    textField: {
      size: "small" as const,
      InputProps: {
        sx: {
          borderRadius: "0.7em",
          backgroundColor: "#ffffff",
          "&.Mui-disabled": {
            backgroundColor: "#f5f5f5",
          },
        },
      },
    },
  },
};

export const ThemeConfig: React.FC<ThemeProp> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
