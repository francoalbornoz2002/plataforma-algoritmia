import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import TemaChip from "../../../components/TemaChip";
import type { ConsultaSimple } from "../../../types";

// Helper para formatear la fecha (el "hack" anti-UTC)
const formatFechaSimple = (fechaISO: string) => {
  if (!fechaISO) return "";
  const fechaString = fechaISO.split("T")[0]; // "2025-11-11"
  const [year, month, day] = fechaString.split("-");
  return `${day}/${month}/${year}`; // "11/11/2025"
};

interface ConsultaDetailInfoModalProps {
  open: boolean;
  onClose: () => void;
  consulta: ConsultaSimple | null;
}

// --- 2. Nuevo Componente: Modal de Detalle (interno) ---
export default function ConsultaDetailInfoModal({
  open,
  onClose,
  consulta,
}: ConsultaDetailInfoModalProps) {
  if (!consulta) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="body2" color="text.secondary">
          Consulta de {consulta.alumno.nombre} {consulta.alumno.apellido} (
          {formatFechaSimple(consulta.fechaConsulta)})
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6" noWrap>
            {consulta.titulo}
          </Typography>
          <TemaChip tema={consulta.tema} />
        </Stack>
        <Divider />
        <Typography variant="body1" sx={{ mt: 1 }}>
          {consulta.descripcion}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
