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
import { Container, Toolbar, Typography, Alert } from "@mui/material";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";

// Iconos
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SideBarList from "./SidebarList";
import { AccountCircle, School } from "@mui/icons-material";
import { useCourseContext } from "../../context/CourseContext";
import type { MenuItemType } from "../../types";
import { useAuth } from "../../features/authentication/context/AuthProvider";
import ProfileModal from "../../features/users/components/ProfileModal";
import { useLocation } from "react-router";

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

export interface SidebarLayoutProps {
  menuItems: MenuItemType[]; // Array de elementos del menú
  userInitial?: string; // Inicial del usuario (opcional)
  userPhotoUrl?: string | null; // <-- Nueva prop para la foto
  children: React.ReactNode; // Para renderizar el contenido de la página
  onOpenCourseSwitcher?: () => void; // Función para el botón del avatar
}

// Componente principal Sidebar
export default function Sidebar({
  menuItems,
  userInitial = "U",
  userPhotoUrl,
  children,
  onOpenCourseSwitcher,
}: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [openProfileModal, setOpenProfileModal] = useState(false); // Estado del modal
  const theme = useTheme();
  const location = useLocation();
  const { logout } = useAuth();

  // Detectar si estamos en la página de reportes para ajustar el layout
  const isReportsPage = location.pathname.startsWith("/dashboard/reports");

  // --- OBTENER EL CONTEXTO DEL CURSO --- //
  // (La envolvemos en un try/catch porque el Admin NO tiene este contexto)
  let selectedCourseName: string | null = null;
  let isReadOnlyMode = false;
  try {
    // Si somos Alumno o Docente
    const { selectedCourse, isLoading, isReadOnly } = useCourseContext();
    if (selectedCourse && !isLoading) {
      // Obtenemos el nombre del curso para mostrarlo en el título de la página
      selectedCourseName = selectedCourse.nombre;
      isReadOnlyMode = isReadOnly;
    }
  } catch (e) {
    // Si falla (somos Admin), selectedCourseName se queda 'null',
    selectedCourseName = null;
    isReadOnlyMode = false;
  }

  // --- OBTENER EL TÍTULO ACTUAL DE LA PÁGINA --- //
  const currentPageTitle = useMemo(() => {
    // Busca el item del menú cuya ruta coincida exactamente o sea el prefijo más largo
    let bestMatch = menuItems.find((item) => item.path === location.pathname);
    if (!bestMatch) {
      // Si no hay coincidencia exacta, busca el prefijo más específico
      const matchingItems = menuItems.filter((item) =>
        location.pathname.startsWith(
          item.path + (item.path === "/dashboard" ? "" : "/"),
        ),
      );
      // Ordena por longitud de path descendente para encontrar el más específico
      bestMatch = matchingItems.sort(
        (a, b) => b.path.length - a.path.length,
      )[0];
    }
    const pageTitle = bestMatch ? bestMatch.text : "Plataforma Algoritmia";

    // Si tenemos un nombre de curso (somos Alumno o Docente), lo añadimos
    if (selectedCourseName) {
      return `${selectedCourseName} - ${pageTitle}`;
    }

    return pageTitle; // Fallback para Admin
  }, [location.pathname, menuItems, selectedCourseName]);

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

  const handleOpenProfile = () => {
    setOpenProfileModal(true);
    handleCloseUserMenu();
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={open} style={{ borderRadius: 0 }}>
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
          {/* Título de la página */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentPageTitle}
          </Typography>
          {/* Avatar del usuario */}
          <Box sx={{ flexShrink: 0 }}>
            <Tooltip title="Opciones de Usuario">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  src={userPhotoUrl || undefined}
                  sx={{ width: 32, height: 32 }}
                >
                  {userInitial}
                </Avatar>
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
              {/* Cambiamos Link por onClick para abrir el modal */}
              <MenuItem onClick={handleOpenProfile}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mi cuenta</ListItemText>
              </MenuItem>
              {onOpenCourseSwitcher && (
                <MenuItem
                  onClick={() => {
                    onOpenCourseSwitcher();
                    handleCloseUserMenu();
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
        maxWidth={isReportsPage ? false : "xl"} // Sin límite de ancho en reportes
        disableGutters={isReportsPage} // Sin padding lateral en reportes
        sx={{
          flexGrow: 1,
          pt: isReportsPage ? 0 : 3, // Sin padding superior en reportes
          pb: isReportsPage ? 0 : 3, // Sin padding inferior en reportes
        }}
      >
        <DrawerHeader />
        {isReadOnlyMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Este curso ha finalizado. Estás viendo una versión histórica de solo
            lectura.
          </Alert>
        )}
        {children}
      </Container>

      {/* Modal de Perfil */}
      <ProfileModal
        open={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
      />
    </Box>
  );
}
