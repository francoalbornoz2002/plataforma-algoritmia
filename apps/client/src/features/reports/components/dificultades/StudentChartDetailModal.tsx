import { useState, useEffect, useMemo } from "react";
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
import { getStudentDifficultiesDetail } from "../../../users/services/docentes.service";
import DifficultyCard from "../../../difficulties/components/DifficultyCard";
import type { DificultadAlumnoDetallada } from "../../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  idCurso: string;
  idAlumno: string;
  filterType: "grado" | "tema";
  filterValue: string;
  title: string;
}

export default function StudentChartDetailModal({
  open,
  onClose,
  idCurso,
  idAlumno,
  filterType,
  filterValue,
  title,
}: Props) {
  const [difficulties, setDifficulties] = useState<DificultadAlumnoDetallada[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      getStudentDifficultiesDetail(idCurso, idAlumno)
        .then(setDifficulties)
        .catch((err) =>
          setError(err.message || "Error al cargar las dificultades."),
        )
        .finally(() => setLoading(false));
    }
  }, [open, idCurso, idAlumno]);

  const filtered = useMemo(() => {
    return difficulties.filter((d) => {
      if (filterType === "grado") return d.grado === filterValue;
      if (filterType === "tema") return d.tema === filterValue;
      return true;
    });
  }, [difficulties, filterType, filterValue]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filtered.length === 0 ? (
          <Alert severity="info">
            No se encontraron dificultades para esta selección.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {filtered.map((d) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={d.id}>
                <DifficultyCard dificultad={d} />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
