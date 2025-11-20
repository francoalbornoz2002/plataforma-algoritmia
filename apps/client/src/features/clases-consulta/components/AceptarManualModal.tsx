import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
// Componentes MUI X
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
// Utilidades de fecha
import { format, addDays } from "date-fns";
import type { ClaseConsulta } from "../../../types";
import apiClient from "../../../lib/axios";

interface AceptarManualModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clase: ClaseConsulta | null;
}

export default function AceptarManualModal({
  open,
  onClose,
  onSuccess,
  clase,
}: AceptarManualModalProps) {
  // Estados: Ahora guardamos objetos Date para compatibilidad con MUI X
  const [fecha, setFecha] = useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = useState<Date | null>(null);
  const [horaFin, setHoraFin] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (clase && open) {
      // El backend envía strings ISO (ej: "2025-11-25T10:00:00.000Z")
      // El constructor new Date() los parsea correctamente para los Pickers.
      setFecha(new Date(clase.fechaClase));
      setHoraInicio(new Date(clase.horaInicio));
      setHoraFin(new Date(clase.horaFin));

      setError(null);
    }
  }, [clase, open]);

  const handleSubmit = async () => {
    if (!clase || !fecha || !horaInicio || !horaFin) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Formateamos los objetos Date a strings para el Backend
      const payload = {
        fechaClase: format(fecha, "yyyy-MM-dd"),
        horaInicio: format(horaInicio, "HH:mm"),
        horaFin: format(horaFin, "HH:mm"),
      };

      await apiClient.patch(
        `/clases-consulta/${clase.id}/aceptar-reprogramar`,
        payload
      );

      onSuccess();
      onClose();
      // (Opcional) Podrías usar enqueueSnackbar aquí si tienes notistack
      alert("¡Clase aceptada y reprogramada con éxito!");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al procesar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  };

  // Límites de fecha (Hoy hasta +7 días)
  const minDate = new Date();
  const maxDate = addDays(new Date(), 7);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Aceptar y Reprogramar</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Define el nuevo horario para confirmar la clase.
          </Typography>

          {/* DatePicker con límites */}
          <DatePicker
            label="Nueva Fecha"
            value={fecha}
            onChange={(newValue) => setFecha(newValue)}
            minDate={minDate}
            maxDate={maxDate}
            disablePast
            slotProps={{ textField: { fullWidth: true } }}
          />

          <Stack direction="row" spacing={2}>
            {/* TimePickers */}
            <TimePicker
              label="Hora Inicio"
              ampm={false} // Formato 24hs
              value={horaInicio}
              onChange={(newValue) => setHoraInicio(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TimePicker
              label="Hora Fin"
              ampm={false}
              value={horaFin}
              onChange={(newValue) => setHoraFin(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar Cambio"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
