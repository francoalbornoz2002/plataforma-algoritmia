import { useEffect, useState } from "react";
import { Box, Typography, Grid, CircularProgress, Alert } from "@mui/material";

// 1. Imports de Lógica
import { getInstitucion } from "../services/institution.service";
import type { Institucion } from "../../../types";

// 2. Imports de Componentes Hijos (los nuevos)
import InstitutionInfo from "../components/InstitutionInfo";
import InstitutionForm from "../components/InstitutionForm";

export default function SettingsPage() {
  // Estado principal: los datos de la institución
  const [institucion, setInstitucion] = useState<Institucion | null>(null);

  // Estado de carga inicial (para la página completa)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- EFECTO DE CARGA INICIAL ---
  useEffect(() => {
    const loadInstitucion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Llama al servicio que puede devolver datos O null
        const data = await getInstitucion();
        setInstitucion(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInstitucion();
  }, []); // Solo se ejecuta 1 vez al montar la página

  // --- Callback para el formulario ---
  // Cuando el formulario 'InstitutionForm' guarda con éxito,
  // llama a esta función con los nuevos datos.
  const handleSave = (newData: Institucion) => {
    // Actualizamos el estado de esta página,
    // lo que automáticamente re-renderiza 'InstitutionInfo'.
    setInstitucion(newData);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuración de la Institución
      </Typography>

      {/* --- Manejo de Carga Inicial --- */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        // --- El Layout de 2 Columnas ---
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Columna Izquierda: El Formulario */}
          <Grid size={{ xs: 12, md: 7 }}>
            <InstitutionForm
              initialData={institucion} // Le pasa los datos (o null)
              onSave={handleSave} // Le pasa el callback de éxito
            />
          </Grid>

          {/* Columna Derecha: La Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <InstitutionInfo
              institucion={institucion} // Le pasa los datos (o null)
              isLoading={isLoading}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
