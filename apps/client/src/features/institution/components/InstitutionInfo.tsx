import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
  CircularProgress,
} from "@mui/material";
import type { Institucion } from "../../../types";

// (Puedes importar iconos si quieres, ej: Business, Email, Phone)

interface InstitutionInfoProps {
  institucion: Institucion | null;
  isLoading: boolean;
}

export default function InstitutionInfo({
  institucion,
  isLoading,
}: InstitutionInfoProps) {
  return (
    <Card elevation={5} sx={{ height: "100%" }}>
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
          <Stack spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Nombre de la Institución
              </Typography>
              <Typography variant="h6" component="div">
                {institucion.nombre}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2">
                Direccion
              </Typography>
              <Typography variant="body1">{institucion.direccion}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2">
                Localidad y Provincia
              </Typography>
              <Typography variant="body1">
                {institucion.localidad.localidad},{" "}
                {institucion.localidad.provincia.provincia}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2">
                Email
              </Typography>
              <Typography variant="body1">{institucion.email}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2">
                Teléfono
              </Typography>
              <Typography variant="body1">{institucion.telefono}</Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
