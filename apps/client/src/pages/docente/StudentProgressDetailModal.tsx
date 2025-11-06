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
} from "@mui/material";
import { getStudentMissions } from "../../services/docentes.service";
import type { MisionConEstado } from "../../types";
import MissionCard from "../../components/MissionCard";

interface StudentProgressDetailModalProps {
  open: boolean;
  onClose: () => void;
  idCurso: string;
  idAlumno: string;
  nombreAlumno: string;
}

export default function StudentProgressDetailModal({
  open,
  onClose,
  idCurso,
  idAlumno,
  nombreAlumno,
}: StudentProgressDetailModalProps) {
  const [missions, setMissions] = useState<MisionConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto de Fetch (se activa cuando el modal se abre)
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setMissions([]);

      // Llamamos al servicio del docente
      getStudentMissions(idCurso, idAlumno)
        .then((data) => {
          setMissions(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idCurso, idAlumno]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Misiones de {nombreAlumno}</DialogTitle>
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
          <Box sx={{ mt: 2 }}>
            {missions.length === 0 ? (
              <Alert severity="info">
                Este alumno aún no tiene misiones asignadas.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {missions.map((missionData) => (
                  <Grid
                    size={{ xs: 12, sm: 6, md: 4 }}
                    key={missionData.mision.id}
                  >
                    <MissionCard missionData={missionData} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
