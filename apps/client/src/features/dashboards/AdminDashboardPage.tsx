import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function AdminDashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Aquí irá el dashboard del administrador con estadísticas y resumen de
        interés del sistema.
      </Typography>
    </Box>
  );
}
