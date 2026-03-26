import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Stack,
  Typography,
  AlertTitle,
} from "@mui/material";
import {
  estado_clase_consulta,
  type ClaseConsulta,
  type ConsultaDocente,
} from "../../../types";
import ConsultaAccordion from "../../consultas/components/ConsultaAccordion";

interface ClaseDetailModalProps {
  open: boolean;
  onClose: () => void;
  clase: ClaseConsulta;
}

export default function ClaseDetailModal({
  open,
  onClose,
  clase,
}: ClaseDetailModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle bgcolor="primary.main" color="white">
        Consultas a revisar en la clase {clase.nombre}
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "grey.100", height: 600 }}>
        {/* Mostrar Motivo si existe (Cancelada o No Realizada) */}
        {clase.motivo && (
          <Alert severity="error" variant="standard" sx={{ mb: 2 }}>
            <AlertTitle>
              Clase{" "}
              {clase.estadoClase === estado_clase_consulta.Cancelada
                ? "Cancelada"
                : "No Realizada"}
            </AlertTitle>
            <Typography variant="body2">
              <strong>Motivo dado por el docente:</strong> {clase.motivo}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 1 }}>
          {clase.consultasEnClase && clase.consultasEnClase.length > 0 ? (
            <Stack spacing={1}>
              {clase.consultasEnClase.map((item: any) => (
                <ConsultaAccordion
                  key={item.consulta.id}
                  consulta={item.consulta as ConsultaDocente}
                />
              ))}
            </Stack>
          ) : (
            <Stack height={100} alignItems="center" justifyContent="center">
              <Typography color="text.secondary">
                No hay consultas asignadas a esta clase.
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
