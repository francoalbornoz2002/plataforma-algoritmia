import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Edit, Assessment, Settings } from "@mui/icons-material";
import InstitutionInfo from "../components/InstitutionInfo";
import InstitutionForm from "../components/InstitutionForm";
import { getAdminDashboardStats } from "../../users/services/user.service";
import type { Institucion } from "../../../types";
import HeaderPage from "../../../components/HeaderPage";

export default function SettingsPage() {
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstitutionFormModalOpen, setIsInstitutionFormModalOpen] =
    useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setInstitucion(data.institution);
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar datos de la institución.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleInstitutionFormSave = (newData: Institucion) => {
    setInstitucion(newData);
    setIsInstitutionFormModalOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <HeaderPage
        title="Configuración del sistema"
        description="Gestiona los datos de la institución educativa y otros parámetros del sistema."
        icon={<Settings />}
        color="primary"
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Assessment color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary" fontWeight="bold">
              Datos de la Institución
            </Typography>
          </Box>
          <Button
            startIcon={<Edit />}
            size="small"
            variant="outlined"
            onClick={() => setIsInstitutionFormModalOpen(true)}
          >
            {institucion ? "Editar Info" : "Registrar Institución"}
          </Button>
        </Box>
        <InstitutionInfo institucion={institucion} isLoading={loading} />
      </Paper>

      <Dialog
        open={isInstitutionFormModalOpen}
        onClose={() => setIsInstitutionFormModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <InstitutionForm
          initialData={institucion}
          onSave={handleInstitutionFormSave}
        />
      </Dialog>
    </Stack>
  );
}
