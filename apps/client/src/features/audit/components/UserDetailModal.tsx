import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getUserById } from "../../users/services/user.service";
import type { UserData } from "../../../types";

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function UserDetailModal({
  open,
  onClose,
  userId,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      setError(null);
      getUserById(userId)
        .then(setUser)
        .catch(() => setError("No se pudo cargar la información del usuario."))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalle del Usuario</DialogTitle>
      <DialogContent dividers sx={{ p: 1 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {user && !loading && (
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Nombre y Apellido"
                secondary={`${user.nombre} ${user.apellido}`}
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BadgeIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="DNI"
                secondary={user.dni}
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CakeIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Fecha de Nacimiento"
                secondary={
                  user.fechaNacimiento
                    ? format(new Date(user.fechaNacimiento), "dd/MM/yyyy", {
                        locale: es,
                      })
                    : "-"
                }
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <WcIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Género"
                secondary={user.genero}
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={user.email}
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <VerifiedUserIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Rol"
                secondary={
                  <Chip
                    label={user.rol}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.75rem" }}
                  />
                }
                primaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ToggleOnIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Estado"
                secondary={
                  <Chip
                    label={user.deletedAt ? "Inactivo" : "Activo"}
                    size="small"
                    color={user.deletedAt ? "error" : "success"}
                    sx={{ height: 20, fontSize: "0.75rem" }}
                  />
                }
                primaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 7 }} />

            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CalendarTodayIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Fecha de Alta"
                secondary={
                  user.createdAt
                    ? format(new Date(user.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })
                    : "-"
                }
                primaryTypographyProps={{ variant: "caption" }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                }}
              />
            </ListItem>
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
