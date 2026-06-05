import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type {} from "@mui/x-data-grid/themeAugmentation";
import type { JSX } from "react";
import type {} from "@mui/x-date-pickers/themeAugmentation";

type ThemeProp = {
  children: JSX.Element;
};

export const theme = createTheme({
  palette: {
    mode: "light",
    DataGrid: {
      // Column header background
      headerBg: "#e6e8f2",
    },
    primary: {
      main: "#0c1e60",
      "100": "#c0c6df",
      "50": "#e6e8f2",
    },
    secondary: {
      main: "#0c4860",
      "100": "#b3dcf0",
      "50": "#d5f2ff",
    },
    text: {
      primary: "rgba(4,4,4,0.8)",
    },
    success: {
      main: "#2e7d32",
      "100": "#c8e6c9",
      "50": "#e8f5e9",
    },
    error: {
      main: "#c62828",
      "100": "#ffcdd2",
      "50": "#ffebee",
    },
    warning: {
      main: "#fb8c00",
      "100": "#ffdfb2",
      "50": "#fff3e0",
      contrastText: "#ffffff",
    },
    info: {
      main: "#0288d1",
      "100": "#b3e5fc",
      "50": "#e1f5fe",
    },
    grey: {
      "600": "#757575",
      "500": "#9e9e9e",
      "100": "#f5f5f5",
      "50": "#eeeeee",
    },
  },
  typography: {
    fontFamily: ["Poppins", "sans-serif"].join(","),
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
            backgroundColor: "#f5f5f5",
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: "14px",
          fontSize: 12,
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
