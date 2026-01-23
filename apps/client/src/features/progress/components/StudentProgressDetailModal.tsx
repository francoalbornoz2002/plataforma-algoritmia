import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import type { ProgresoAlumnoDetallado } from "../../../types";
import MissionCard from "./MissionCard";

interface StudentProgressDetailModalProps {
  open: boolean;
  onClose: () => void;
  studentData: ProgresoAlumnoDetallado;
}

export default function StudentProgressDetailModal({
  open,
  onClose,
  studentData,
}: StudentProgressDetailModalProps) {
  const [normalMissions, setNormalMissions] = useState<any[]>([]);
  const [specialMissions, setSpecialMissions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentData) {
      try {
        setNormalMissions(studentData.misionesCompletadas || []);
        setSpecialMissions(studentData.misionesEspeciales || []);

        // --- CORRECCIÓN AQUÍ ---
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error al procesar los datos del alumno.");
        setLoading(false);
      }
    }
  }, [studentData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Progreso de {studentData.nombre} {studentData.apellido}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ mt: 1 }}>
            {/* --- SECCIÓN 1: CAMPAÑA --- */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              🎮 Misiones de Campaña
            </Typography>

            {normalMissions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 4 }}>
                Este alumno no tiene misiones de campaña completadas.
              </Alert>
            ) : (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {normalMissions.map((m) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.mision.id}>
                    <MissionCard missionData={m} />
                  </Grid>
                ))}
              </Grid>
            )}

            {/* --- DIVISOR --- */}
            {specialMissions.length > 0 && <Divider sx={{ my: 3 }} />}

            {/* --- SECCIÓN 2: ESPECIALES --- */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "purple",
              }}
            >
              🌟 Misiones Especiales
            </Typography>

            {specialMissions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 4 }}>
                Este alumno no tiene misiones especiales completadas.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {specialMissions.map((missionData) => (
                  <Grid
                    size={{ xs: 12, sm: 6, md: 4 }}
                    key={missionData.id} // UUID
                  >
                    {/* MissionCard ya es polimórfico y acepta MisionEspecial */}
                    <MissionCard missionData={missionData} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
