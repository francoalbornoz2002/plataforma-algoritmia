import {
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PlaceIcon from "@mui/icons-material/Place";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import type { Institucion } from "../../../types"; // Mantener la importación

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
    <Box sx={{ height: "100%" }}>
      {" "}
      {/* Cambiado de Card a Box, ya que Paper es el padre */}
      <CardContent>
        {/* El título y el botón de edición ahora los maneja el componente padre (AdminDashboardPage) */}

        {isLoading ? (
          <CircularProgress />
        ) : !institucion ? (
          <Typography color="text.secondary">
            No hay datos de la institución. Por favor, complete el formulario.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {/* Nombre de la Institución */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <BusinessIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Nombre:</strong> {institucion.nombre}
              </Typography>
            </Box>

            {/* Ubicación */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PlaceIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Ubicación:</strong> {institucion.direccion},{" "}
                {institucion.localidad.localidad},{" "}
                {institucion.localidad.provincia.provincia}
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <EmailIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Email:</strong> {institucion.email}
              </Typography>
            </Box>

            {/* Teléfono */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PhoneIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>Teléfono:</strong> {institucion.telefono}
              </Typography>
            </Box>

            {/* Título para el Logo */}
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Logo de la Institución:
            </Typography>

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
    </Box>
  );
}
