import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface DashboardHeaderProps {
  nombre: string | undefined;
  curso?: string;
}

export default function DashboardHeader({
  nombre,
  curso,
}: DashboardHeaderProps) {
  return (
    <Stack spacing={1}>
      <Typography variant="h4" color="primary.main" fontWeight="bold">
        ¡Hola, {nombre}! 👋
      </Typography>
      {curso ? (
        <Typography variant="body2" color="text.secondary">
          Bienvenido a la Plataforma Algoritmia, estás visualizando el curso:{" "}
          <strong>{curso}</strong>.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Bienvenido a la administración de la Plataforma Algoritmia.
        </Typography>
      )}
    </Stack>
  );
}
