import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PlaceIcon from "@mui/icons-material/Place";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import type { Institucion } from "../../../types";

interface InstitutionInfoProps {
  institucion: Institucion | null;
  isLoading: boolean;
}

const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

export default function InstitutionInfo({
  institucion,
  isLoading,
}: InstitutionInfoProps) {
  return (
    <Card elevation={5} sx={{ maxWidth: 800, height: "100%", p: 1 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          Datos actuales de la Institución
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {isLoading ? (
          <CircularProgress />
        ) : !institucion ? (
          <Typography color="text.secondary">
            No hay datos de la institución. Por favor, complete el formulario.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <BusinessIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Nombre de la Institución"
                secondary={institucion.nombre}
                slotProps={{
                  primary: { variant: "body2", color: "textSecondary" },
                  secondary: { variant: "body1", color: "textPrimary" },
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <PlaceIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Ubicación"
                secondary={`${institucion.direccion}, ${institucion.localidad.localidad}, ${institucion.localidad.provincia.provincia}`}
                slotProps={{
                  primary: { variant: "body2", color: "textSecondary" },
                  secondary: { variant: "body1", color: "textPrimary" },
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <EmailIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Email de Contacto"
                secondary={institucion.email}
                slotProps={{
                  primary: { variant: "body2", color: "textSecondary" },
                  secondary: { variant: "body1", color: "textPrimary" },
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <PhoneIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Teléfono de Contacto"
                secondary={institucion.telefono}
                slotProps={{
                  primary: { variant: "body2", color: "textSecondary" },
                  secondary: { variant: "body1", color: "textPrimary" },
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemIcon sx={{ minWidth: "auto" }}>
                <PhoneIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Logo o imagen de la institución"
                slotProps={{
                  primary: { variant: "body2", color: "textSecondary" },
                }}
              />
            </Stack>

            {/* --- Logo --- */}
            {institucion.logoUrl && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  mt: 2,
                }}
              >
                <img
                  src={`${baseUrl}${institucion.logoUrl}`}
                  alt="Logo Institución"
                  style={{
                    maxHeight: 100,
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
