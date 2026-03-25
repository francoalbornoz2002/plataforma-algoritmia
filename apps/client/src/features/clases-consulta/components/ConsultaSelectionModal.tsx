import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Checkbox,
  Alert,
} from "@mui/material";
import type { ConsultaDocente } from "../../../types";
import ConsultaAccordion from "../../consultas/components/ConsultaAccordion";

interface ConsultaSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  consultasList: ConsultaDocente[];
  initialSelection: string[];
}

export default function ConsultaSelectionModal({
  open,
  onClose,
  onConfirm,
  consultasList,
  initialSelection,
}: ConsultaSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelection);
    }
  }, [open, initialSelection]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedIds);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Seleccionar Consultas Pendientes</DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "grey.50", height: 500 }}>
        {consultasList.length === 0 ? (
          <Stack height="100%" alignItems="center" justifyContent="center">
            <Typography color="text.secondary">
              No hay consultas disponibles para seleccionar.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Selecciona las consultas que deseas abordar en esta clase.
            </Alert>
            {consultasList.map((consulta) => {
              const isSelected = selectedIds.includes(consulta.id);
              return (
                <Box
                  key={consulta.id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggle(consulta.id)}
                    sx={{ mt: 2.5 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <ConsultaAccordion consulta={consulta} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained">
          Aceptar ({selectedIds.length} seleccionadas)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
