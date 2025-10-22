// src/components/layout/Sidebar.tsx

import React, { useState } from "react";
import {
  styled,
  useTheme,
  type Theme,
  type CSSObject,
} from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";

// Importa los iconos
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";

// Importa Link y useLocation de react-router-dom
import { Link as RouterLink, useLocation } from "react-router";

const drawerWidth = 240;
const closedDrawerWidth = (theme: Theme) => `calc(${theme.spacing(7)} + 1px)`;
const closedDrawerWidthSmUp = (theme: Theme) =>
  `calc(${theme.spacing(8)} + 1px)`;

// --- Funciones de estilo para la animación del Drawer ---
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

// --- Componente Drawer estilizado ---
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

// --- Componente principal del Sidebar ---
export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    // Lógica para cerrar sesión
    handleCloseUserMenu();
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/dashboard/users" },
    { text: "Cursos", icon: <SchoolIcon />, path: "/dashboard/courses" },
    { text: "Estadísticas", icon: <BarChartIcon />, path: "/dashboard/stats" },
    { text: "Reportes", icon: <AssessmentIcon />, path: "/dashboard/reports" },
    { text: "Auditoría", icon: <VpnKeyIcon />, path: "/dashboard/audit" },
    {
      text: "Configuración",
      icon: <SettingsIcon />,
      path: "/dashboard/settings",
    },
  ];

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton onClick={handleDrawerToggle}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />

      {/* Lista de Navegación */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <Tooltip title={open ? "" : item.text} placement="right">
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Divider />

      {/* --- Sección de Usuario --- */}
      <Box sx={{ mt: "auto" }}>
        {" "}
        {/* Empuja esta sección al fondo */}
        <ListItem disablePadding sx={{ display: "block" }}>
          {/* Contenedor principal */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minHeight: 48,
              // CAMBIO: El padding horizontal ahora siempre es el mismo, calculado para centrar el icono cuando está cerrado
              px: `calc((${closedDrawerWidthSmUp(theme)} - 32px) / 2)`, // (AnchoCerrado - AnchoAvatar) / 2
              py: 1.5,
              cursor: !open ? "pointer" : "default",
            }}
            onClick={!open ? handleOpenUserMenu : undefined}
          >
            {/* Contenedor del Avatar (Icono) - SIN márgenes que cambien */}
            <ListItemIcon
              sx={{
                minWidth: 0, // Importante
                // QUITAMOS márgenes variables, el padding del padre lo posiciona
                justifyContent: "center",
              }}
            >
              <Tooltip
                title={open ? "" : "Opciones de Usuario"}
                placement="right"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  A {/* Iniciales */}
                </Avatar>
              </Tooltip>
            </ListItemIcon>

            {/* Contenedor para Texto y Botón */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
                overflow: "hidden",
                opacity: open ? 1 : 0,
                // CAMBIO: Margen izquierdo solo cuando está ABIERTO para separar del icono
                ml: open ? theme.spacing(1.5) : 0,
                // Transición instantánea de opacidad y margen al cerrar
                transition: theme.transitions.create(
                  ["opacity", "margin-left", "width"],
                  {
                    easing: theme.transitions.easing.sharp,
                    duration: open
                      ? theme.transitions.duration.enteringScreen
                      : 0,
                  }
                ),
                width: open ? "auto" : 0,
                minWidth: open ? "auto" : 0,
              }}
            >
              <ListItemText
                primary="Administrador"
                primaryTypographyProps={{
                  fontWeight: "bold",
                  variant: "body2",
                  noWrap: true,
                }}
                sx={{ m: 0 }}
              />
              <IconButton
                onClick={handleOpenUserMenu}
                size="small"
                sx={{ ml: "auto" }}
                edge="end"
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </ListItem>
        {/* Menú de Usuario */}
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{
            vertical: "top",
            horizontal: open ? "right" : "left",
          }}
          sx={{ ml: open ? 0 : 1 }}
          PaperProps={
            {
              /* ... */
            }
          }
        >
          {/* ... (MenuItems) ... */}
          <MenuItem onClick={handleCloseUserMenu}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Perfil</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleCloseUserMenu}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mi cuenta</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar sesión</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
}
