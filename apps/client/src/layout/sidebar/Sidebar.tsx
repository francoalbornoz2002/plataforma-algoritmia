import React, { useMemo, useState } from "react";
import {
  styled,
  useTheme,
  type Theme,
  type CSSObject,
} from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Container, Toolbar, Typography } from "@mui/material";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";

// Iconos
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import { Link, useLocation } from "react-router";
import SideBarList from "./SidebarList";
import { AccountCircle, School } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";

const drawerWidth = 240;
const closedDrawerWidth = (theme: Theme) => `calc(${theme.spacing(7)} + 1px)`;
const closedDrawerWidthSmUp = (theme: Theme) =>
  `calc(${theme.spacing(8)} + 1px)`;

// Funciones de estilo para la animación del Drawer
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: closedDrawerWidth(theme),
  [theme.breakpoints.up("sm")]: {
    width: closedDrawerWidthSmUp(theme),
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

// Estilos del AppBar
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

// Estilos del Sidebar
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

// --- INTERFACES PARA PROPS ---
export interface MenuItemType {
  text: string;
  icon: React.ReactElement; // El icono será un elemento JSX
  path: string;
}

export interface SidebarLayoutProps {
  menuItems: MenuItemType[]; // Array de elementos del menú
  userInitial?: string; // Inicial del usuario (opcional)
  children: React.ReactNode; // Para renderizar el contenido de la página
  onOpenCourseSwitcher?: () => void; // Función para el botón del avatar
}

// Componente principal Sidebar
export default function Sidebar({
  menuItems,
  userInitial = "U",
  children,
  onOpenCourseSwitcher,
}: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const location = useLocation();
  const { logout } = useAuth();

  // --- Lógica para obtener el título actual ---
  const currentPageTitle = useMemo(() => {
    // Busca el item del menú cuya ruta coincida exactamente o sea el prefijo más largo
    let bestMatch = menuItems.find((item) => item.path === location.pathname);
    if (!bestMatch) {
      // Si no hay coincidencia exacta, busca el prefijo más específico
      const matchingItems = menuItems.filter((item) =>
        location.pathname.startsWith(
          item.path + (item.path === "/dashboard" ? "" : "/")
        )
      );
      // Ordena por longitud de path descendente para encontrar el más específico
      bestMatch = matchingItems.sort(
        (a, b) => b.path.length - a.path.length
      )[0];
    }
    return bestMatch ? bestMatch.text : "Plataforma Algoritmia"; // Fallback al título original
  }, [location.pathname, menuItems]);
  // --- Fin Lógica Título ---

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          {/* Icono para abrir la Sidebar */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          {/* Avatar del usuario y menú desplegable */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentPageTitle}
          </Typography>
          {/* Avatar del usuario */}
          <Box sx={{ flexShrink: 0 }}>
            <Tooltip title="Opciones de Usuario">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar sx={{ width: 32, height: 32 }}>{userInitial}</Avatar>
              </IconButton>
            </Tooltip>
            {/* Menú desplegable del usuario */}
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem
                onClick={handleCloseUserMenu}
                component={Link}
                to="/dashboard/account"
              >
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mi cuenta</ListItemText>
              </MenuItem>
              {onOpenCourseSwitcher && (
                <MenuItem
                  onClick={() => {
                    onOpenCourseSwitcher(); // Llama a la función del layout
                    handleCloseUserMenu(); // Cierra el menú
                  }}
                >
                  <ListItemIcon>
                    <School fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Cambiar de curso</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Cerrar sesión</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Sidebar */}
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <SideBarList menuItems={menuItems} open={open}></SideBarList>
        <Divider />
      </Drawer>
      <Container
        component="main"
        maxWidth="xl" // O "xl", "md" según prefieras el ancho máximo
        sx={{
          flexGrow: 1,
          pt: 3, // 'Container' ya maneja el padding izquierdo/derecho
          pb: 3, // Mantenemos el padding vertical
        }}
      >
        <DrawerHeader />
        {children}
      </Container>
    </Box>
  );
}
