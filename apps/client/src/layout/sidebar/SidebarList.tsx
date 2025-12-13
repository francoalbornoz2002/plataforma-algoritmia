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
import type { MenuItemType } from "../../types";

interface SideBarListProps {
  menuItems: MenuItemType[]; // Indica que es un array de MenuItemType
  open: boolean; // El estado para saber si el drawer está abierto
}

export default function SideBarList({ menuItems, open }: SideBarListProps) {
  const location = useLocation();
  const theme = useTheme();

  // Calculamos cuál es el path activo comparando con la URL actual
  const activePath = useMemo(() => {
    // Filtramos los items que coinciden con el inicio de la ruta actual
    const matches = menuItems.filter(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
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
                  },
                  open
                    ? {
                        justifyContent: "initial",
                      }
                    : {
                        justifyContent: "center",
                      },
                  // Estilos para el estado activo (seleccionado)
                  isSelected && {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    borderRight: `3px solid ${theme.palette.primary.main}`, // Indicador visual lateral
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.main,
                    },
                  },
                ]}
              >
                <ListItemIcon
                  sx={[
                    {
                      minWidth: 0,
                      justifyContent: "center",
                      // Heredar color si está seleccionado
                      color: isSelected ? "inherit" : undefined,
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
