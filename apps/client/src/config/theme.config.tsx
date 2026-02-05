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
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        style: {
          textTransform: "none",
          borderRadius: "0.7em",
        },
      },
    },
    MuiAlert: {
      defaultProps: {
        style: {
          borderRadius: "0.7em",
        },
      },
    },
    MuiInputBase: {
      defaultProps: {
        style: {
          borderRadius: "0.5em",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        style: {
          borderRadius: "0.7em",
        },
      },
    },
  },
});

export const ThemeConfig: React.FC<ThemeProp> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
