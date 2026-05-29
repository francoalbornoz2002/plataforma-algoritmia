import React, { useState } from "react";
import { alpha } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Container, Stack, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SideBarList from "./SidebarList";
import { AccountCircle } from "@mui/icons-material";
import type { MenuItemType } from "../types";
import { useAuth } from "../features/authentication/context/AuthProvider";
import ProfileModal from "../features/users/components/ProfileModal";
import { useLocation } from "react-router";

const drawerWidth = 295; // Un poco más ancho para albergar los textos del logo y el usuario cómodamente

// --- INTERFACES PARA PROPS ---

export interface AdminLayoutProps {
  menuItems: MenuItemType[]; // Array de elementos del menú
  userInitial?: string; // Inicial del usuario (opcional)
  userPhotoUrl?: string | null; // <-- Nueva prop para la foto
  children: React.ReactNode; // Para renderizar el contenido de la página
}

// Componente principal Layout Administrador
export default function AdminLayout({
  menuItems,
  userInitial = "U",
  userPhotoUrl,
  children,
}: AdminLayoutProps) {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  // Detectar si estamos en la página de reportes para ajustar el layout/espacios
  const isReportsPage = location.pathname.startsWith("/reports");

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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.100" }}>
      {/* Sidebar Permanente */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "primary.main", // Color del layout (oscuro)
            color: "#ffffff",
            borderRight: "none",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0, // Quitamos el borde redondeado heredado del theme global
          },
        }}
      >
        {/* Cabecera del Drawer (Logo y Título de Plataforma) */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            variant="rounded"
            src="/icono-plataforma.png"
            alt="Ícono de la Plataforma Algoritmia"
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #ffffff",
              color: "primary.main",
              width: 48,
              height: 48,
              borderRadius: "0.7em",
            }}
          >
            PA
          </Avatar>
          <Stack spacing={0.5}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
                lineHeight: 1.2,
                letterSpacing: 0.5,
              }}
            >
              PLATAFORMA ALGORITMIA
            </Typography>
            <Typography
              sx={{
                color: alpha("#ffffff", 0.7),
                fontWeight: 500,
                fontSize: 10,
                letterSpacing: 0.5,
              }}
            >
              ADMINISTRACIÓN DEL SISTEMA
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: alpha("#ffffff", 0.1), mb: 2 }} />

        {/* Lista de Navegación */}
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <SideBarList menuItems={menuItems} open={true} variant="admin" />
        </Box>

        <Divider sx={{ borderColor: alpha("#ffffff", 0.1) }} />

        {/* Footer del Drawer (Sección de Usuario) */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": { backgroundColor: alpha("#ffffff", 0.05) },
          }}
          onClick={handleOpenUserMenu}
        >
          <Avatar
            src={userPhotoUrl || undefined}
            sx={{ width: 40, height: 40, bgcolor: alpha("#ffffff", 0.2) }}
          >
            {userInitial}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Administrador
            </Typography>
            <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.7) }}>
              admin@mail.com
            </Typography>
          </Box>
        </Box>

        {/* Menú desplegable del usuario, anclado abajo */}
        <Menu
          sx={{ mt: "-10px" }}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
        >
          <MenuItem onClick={handleOpenProfile}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Perfil</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: "error.main" }}>
              Cerrar sesión
            </ListItemText>
          </MenuItem>
        </Menu>
      </Drawer>

      {/* Área Principal de Contenido */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Container
          maxWidth={isReportsPage ? false : "xl"} // Sin límite de ancho en reportes
          disableGutters // Desactivamos gutters por defecto para controlar el padding manualmente
          sx={{
            flexGrow: 1,
            p: isReportsPage ? 0 : 3,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Modal de Perfil */}
      <ProfileModal
        open={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
      />
    </Box>
  );
}
