import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Checkbox,
} from "@mui/material";

// Componentes y Tipos
import type { ClaseConsulta } from "../../../types";
import ConsultaAccordion from "../../consultas/components/ConsultaAccordion";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    realizada: boolean;
    motivo?: string;
    consultasRevisadasIds?: string[];
  }) => void;
  clase: ClaseConsulta | null;
  isLoading?: boolean;
}

export const FinalizarClaseModal = ({
  open,
  onClose,
  onConfirm,
  clase,
  isLoading,
}: Props) => {
  // Estado del formulario
  const [realizada, setRealizada] = useState<string>("si");
  const [motivo, setMotivo] = useState("");

  // Estado para los checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 2. Efecto de Inicialización
  useEffect(() => {
    if (open && clase) {
      setRealizada("si");
      setMotivo("");

      // Por defecto, marcamos TODAS las consultas como revisadas
      const allIds =
        clase.consultasEnClase?.map((item: any) => item.consulta.id) || [];
      setSelectedIds(allIds);
    }
  }, [open, clase]);

  // Handler para seleccionar/deseleccionar
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // 3. Handler de confirmación
  const handleSubmit = () => {
    if (realizada === "no" && !motivo.trim()) return;

    onConfirm({
      realizada: realizada === "si",
      motivo: realizada === "no" ? motivo : undefined,
      consultasRevisadasIds: realizada === "si" ? selectedIds : undefined,
    });
  };

  if (!clase) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={isLoading ? undefined : onClose}
        maxWidth="md" // Un poco más ancho para que entre la tabla
        fullWidth
      >
        <DialogTitle>Finalizar Clase de Consulta</DialogTitle>

        <DialogContent dividers>
          {/* SECCIÓN 1: ¿Se realizó? */}
          <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: "bold" }}>
              ¿Se llevó a cabo la clase?
            </FormLabel>
            <RadioGroup
              row
              value={realizada}
              onChange={(e) => setRealizada(e.target.value)}
            >
              <FormControlLabel
                value="si"
                control={<Radio />}
                label="Sí, se realizó"
              />
              <FormControlLabel
                value="no"
                control={<Radio color="error" />}
                label="No se realizó"
              />
            </RadioGroup>
          </FormControl>

          {/* SECCIÓN 2: Contenido Condicional */}
          {realizada === "si" ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Selecciona las consultas que <b>lograste revisar</b>. Las que
                desmarques volverán a estado "Pendiente".
              </Alert>

              <Box
                sx={{ height: 400, width: "100%", overflowY: "auto", pr: 1 }}
              >
                {clase.consultasEnClase && clase.consultasEnClase.length > 0 ? (
                  <Stack spacing={1.5}>
                    {clase.consultasEnClase.map((item: any) => {
                      const consulta = item.consulta;
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
                            sx={{ mt: 1 }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <ConsultaAccordion consulta={consulta} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Stack
                    height="100%"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography color="text.secondary">
                      Esta clase no tiene consultas asignadas.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Al cancelar, la clase quedará como "No Realizada" y todas las
                consultas volverán a "Pendiente" para ser reagendadas.
              </Alert>
              <TextField
                label="Motivo de cancelación"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica brevemente el motivo (ej: Ausencia docente, problemas técnicos, etc.)"
                required
                error={realizada === "no" && !motivo.trim()}
                helperText={
                  realizada === "no" && !motivo.trim()
                    ? "El motivo es obligatorio" // No necesita || " " porque siempre hay un mensaje aquí
                    : "Este motivo quedará registrado en el historial"
                }
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={realizada === "si" ? "primary" : "error"}
            disabled={isLoading || (realizada === "no" && !motivo.trim())}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : realizada === "si" ? (
              `Confirmar (${selectedIds.length} revisadas)`
            ) : (
              "Confirmar Cancelación"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FinalizarClaseModal;
