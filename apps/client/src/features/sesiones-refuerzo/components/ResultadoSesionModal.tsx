import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useCourseContext } from "../../../context/CourseContext";
import { findSesionById } from "../service/sesiones-refuerzo.service";
import {
  type SesionRefuerzoResumen,
  type SesionRefuerzoConDetalles,
} from "../../../types";
import ResultadoSesionView from "./ResultadoSesionView";

interface ResultadoSesionModalProps {
  open: boolean;
  onClose: () => void;
  sesionResumen: SesionRefuerzoResumen;
}

export default function ResultadoSesionModal({
  open,
  onClose,
  sesionResumen,
}: ResultadoSesionModalProps) {
  const { selectedCourse } = useCourseContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullSesion, setFullSesion] =
    useState<SesionRefuerzoConDetalles | null>(null);

  useEffect(() => {
    if (open && selectedCourse) {
      setLoading(true);
      setError(null);
      findSesionById(selectedCourse.id, sesionResumen.id)
        .then(setFullSesion)
        .catch(() => setError("No se pudo cargar el detalle de la sesión."))
        .finally(() => setLoading(false));
    }
  }, [open, selectedCourse, sesionResumen.id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        Resultados de la Sesión N° {sesionResumen.nroSesion}
      </DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : fullSesion ? (
          <ResultadoSesionView sesion={fullSesion} />
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
