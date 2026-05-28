import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link, useLocation } from "react-router";
import { useMemo } from "react";
import type { MenuItemType } from "../types";

interface SideBarListProps {
  menuItems: MenuItemType[]; // Indica que es un array de MenuItemType
  open: boolean; // El estado para saber si el drawer está abierto
  variant?: "default" | "admin"; // Nueva variante para adaptar estilos
}

export default function SideBarList({
  menuItems,
  open,
  variant = "default",
}: SideBarListProps) {
  const location = useLocation();
  const theme = useTheme();

  // Calculamos cuál es el path activo comparando con la URL actual
  const activePath = useMemo(() => {
    // Filtramos los items que coinciden con el inicio de la ruta actual
    const matches = menuItems.filter(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`),
    );

    // Si hay coincidencias, nos quedamos con la más específica (la más larga)
    if (matches.length > 0) {
      return matches.sort((a, b) => b.path.length - a.path.length)[0].path;
    }
    return null;
  }, [location.pathname, menuItems]);

  return (
    <List sx={{ flexGrow: 1 }}>
      {menuItems.map((item) => {
        const isSelected = item.path === activePath;

        return (
          <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
            <Tooltip title={open ? "" : item.text} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isSelected}
                sx={[
                  {
                    minHeight: 48,
                    px: 2.5,
                    mb: variant === "admin" ? 0.5 : 0,
                    mx: variant === "admin" ? 1 : 0,
                    borderRadius: variant === "admin" ? "0.7em" : 0,
                  },
                  open
                    ? {
                        justifyContent: "initial",
                      }
                    : {
                        justifyContent: "center",
                      },
                  // Estilos para el estado inactivo en modo Admin
                  !isSelected &&
                    variant === "admin" && {
                      color: alpha("#ffffff", 0.7),
                      "& .MuiListItemIcon-root": {
                        color: alpha("#ffffff", 0.7),
                      },
                      "&:hover": {
                        backgroundColor: alpha("#ffffff", 0.1),
                        color: "#ffffff",
                        "& .MuiListItemIcon-root": { color: "#ffffff" },
                      },
                    },
                  // Estilos para el estado activo (seleccionado)
                  isSelected &&
                    (variant === "default"
                      ? {
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.12,
                          ),
                          "&.Mui-selected": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.12,
                            ),
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.2,
                              ),
                            },
                          },
                          borderRight: `3px solid ${theme.palette.primary.main}`,
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.2,
                            ),
                          },
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
                        }
                      : {
                          // Estilo activo para modo Admin
                          color: theme.palette.primary.main,
                          backgroundColor: "#ffffff",
                          "&.Mui-selected": {
                            backgroundColor: "#ffffff",
                            "&:hover": {
                              backgroundColor: alpha("#ffffff", 0.9),
                            },
                          },
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
                        }),
                ]}
              >
                <ListItemIcon
                  sx={[
                    {
                      minWidth: 0,
                      justifyContent: "center",
                      // Heredar color si está seleccionado
                      color:
                        isSelected && variant === "default"
                          ? "inherit"
                          : undefined,
                    },
                    open
                      ? {
                          mr: 3,
                        }
                      : {
                          mr: "auto",
                        },
                  ]}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={[
                    open
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 0,
                        },
                  ]}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
}
