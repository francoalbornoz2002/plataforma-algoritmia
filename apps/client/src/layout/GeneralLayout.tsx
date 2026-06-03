import React, { useMemo, useState } from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  Container,
  Toolbar,
  Typography,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

// Iconos
import LogoutIcon from "@mui/icons-material/Logout";
import { AccountCircle } from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import { useCourseContext } from "../context/CourseContext";
import type { MenuItemType } from "../types";
import { useAuth } from "../features/authentication/context/AuthProvider";
import ProfileModal from "../features/users/components/ProfileModal";
import { Link, useLocation } from "react-router";
import { getGameDownloadUrl } from "../features/game/services/game.service";

// --- INTERFACES PARA PROPS ---

export interface GeneralLayoutProps {
  menuItems: MenuItemType[]; // Array de elementos del menú
  userInitial?: string; // Inicial del usuario (opcional)
  userPhotoUrl?: string | null; // <-- Nueva prop para la foto
  children: React.ReactNode; // Para renderizar el contenido de la página
  onOpenCourseSwitcher?: () => void; // Función para el botón del avatar
}

// Componente principal Layout General
export default function GeneralLayout({
  menuItems,
  userInitial = "U",
  userPhotoUrl,
  children,
  onOpenCourseSwitcher,
}: GeneralLayoutProps) {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [openProfileModal, setOpenProfileModal] = useState(false); // Estado del modal
  const location = useLocation();
  const { logout, profile } = useAuth();

  // Detectar si estamos en la página de reportes para ajustar el layout
  const isReportsPage =
    location.pathname.startsWith("/dashboard/reports") ||
    location.pathname.startsWith("/course/reports");

  // Obtenemos el estado de solo lectura del contexto del curso
  const { isReadOnly: isReadOnlyMode } = useCourseContext();

  // Calculamos cuál es el path activo comparando con la URL actual para las pestañas
  const activePath = useMemo(() => {
    const matches = menuItems.filter(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`),
    );
    if (matches.length > 0) {
      return matches.sort((a, b) => b.path.length - a.path.length)[0].path;
    }
    return null;
  }, [location.pathname, menuItems]);

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

  const handleDownloadGame = () => {
    const url = getGameDownloadUrl();
    // Creamos un enlace temporal para iniciar la descarga nativamente
    const link = document.createElement("a");
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "grey.100",
      }}
    >
      <AppBar
        position="sticky"
        sx={{ bgcolor: "primary.main", color: "#ffffff", borderRadius: 0 }}
      >
        <Toolbar disableGutters sx={{ px: 1, gap: 3 }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src="/logo_web.png"
              alt="Logo Plataforma Algoritmia"
              sx={{
                height: 50,
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Box>

          {/* Tabs de Navegación */}
          <Tabs
            value={activePath || false}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{ style: { display: "none" } }} // Ocultamos la línea de abajo
            sx={{
              maxWidth: { xs: "calc(100vw - 200px)", md: "60vw", lg: 900 }, // Limitamos el ancho fijo
              minWidth: 0, // Permite que se contraiga en pantallas pequeñas
              minHeight: "auto",
              "& .MuiTabs-scrollButtons": {
                color: "white",
                "&.Mui-disabled": { opacity: 0.2 }, // Flechas semi-transparentes cuando no se puede scrollear más
              },
              "& .MuiTabs-flexContainer": {
                gap: 1,
                alignItems: "center",
              },
            }}
          >
            {menuItems.map((item) => (
              <Tab
                key={item.text}
                component={Link}
                to={item.path}
                value={item.path}
                icon={item.icon}
                iconPosition="start"
                label={item.text}
                disableRipple // Quitamos el efecto de onda para que parezca un botón normal
                sx={{
                  minHeight: "auto",
                  p: "8px 16px",
                  borderRadius: "0.7em",
                  textTransform: "none",
                  fontWeight: 500,
                  minWidth: "max-content",
                  color: alpha("#ffffff", 0.7),
                  opacity: 1, // Mantenemos el color constante, MUI Tabs baja la opacidad por defecto
                  "& .MuiTab-iconWrapper": {
                    color: alpha("#ffffff", 0.7),
                    marginRight: 1,
                  },
                  "&:hover": {
                    bgcolor: alpha("#ffffff", 0.1),
                    color: "#ffffff",
                    "& .MuiTab-iconWrapper": { color: "#ffffff" },
                  },
                  "&.Mui-selected": {
                    bgcolor: "#ffffff",
                    color: "primary.main",
                    "& .MuiTab-iconWrapper": { color: "primary.main" },
                    "&:hover": { bgcolor: alpha("#ffffff", 0.9) },
                  },
                }}
              />
            ))}
          </Tabs>

          {/* Avatar del usuario */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              ml: "auto",
              gap: 1.5,
            }}
          >
            {/* Acciones Rápidas (Iconos) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {profile?.rol === "Alumno" && (
                <Tooltip title="Descargar Videojuego">
                  <IconButton color="inherit" onClick={handleDownloadGame}>
                    <VideogameAssetIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onOpenCourseSwitcher && (
                <Tooltip title="Cambiar de curso">
                  <IconButton color="inherit" onClick={onOpenCourseSwitcher}>
                    <SchoolIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                p: 0.5,
                borderRadius: "0.7em",
                transition: "background-color 0.2s",
                "&:hover": { bgcolor: alpha("#ffffff", 0.1) },
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", sm: "block" },
                  p: 0.5,
                  maxWidth: 200,
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                >
                  {profile?.nombre} {profile?.apellido}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  component="div"
                  sx={{ color: alpha("#ffffff", 0.7) }}
                >
                  {profile?.email}
                </Typography>
              </Box>
              <Avatar
                src={userPhotoUrl || undefined}
                sx={{ width: 40, height: 40, bgcolor: alpha("#ffffff", 0.2) }}
              >
                {userInitial}
              </Avatar>
            </Box>
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
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: "error.main" }}>
                  Cerrar sesión
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container
        component="main"
        maxWidth={isReportsPage ? false : "xl"} // Sin límite de ancho en reportes
        disableGutters // Desactivamos gutters por defecto para controlar el padding manualmente
        sx={{
          flexGrow: 1,
          p: isReportsPage ? 0 : 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
