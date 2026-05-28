import { Box, Typography, Alert } from "@mui/material";

export default function SettingsPage() {
  return (
    <Box sx={{ p: 0 }}>
      <Alert severity="info">
        La configuración de la institución ahora se gestiona desde el Dashboard
        de Administrador.
      </Alert>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Navega a "/dashboard" para acceder a la información y edición de la
        institución.
      </Typography>
    </Box>
  );
}
