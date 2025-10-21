import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type { JSX } from "react";

type ThemeProp = {
  children: JSX.Element;
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#004d40",
    },
    secondary: {
      main: "#00838f",
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
          borderRadius: "0.5em",
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
