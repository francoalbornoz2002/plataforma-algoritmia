import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Stack,
  CircularProgress,
  Alert,
  Rating, // <-- Importamos Rating
  Typography,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  valorarConsultaSchema,
  type ValorarConsultaFormValues,
} from "../validations/valorarConsulta.schema";
import type { Consulta } from "../../../types";

// (Importamos el servicio)
import { valorarConsulta } from "../../users/services/alumnos.service";
import { enqueueSnackbar } from "notistack";

interface ValorarConsultaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para refrescar la lista
  consulta: Consulta; // La consulta a valorar
}

export default function ValorarConsultaModal({
  open,
  onClose,
  onSave,
  consulta,
}: ValorarConsultaModalProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValorarConsultaFormValues>({
    resolver: zodResolver(valorarConsultaSchema),
    defaultValues: {
      valoracion: 0,
      comentarioValoracion: "",
    },
  });

  // Limpiamos el form cuando se cierra
  const handleClose = () => {
    onClose();
    reset();
    setApiError(null);
  };

  const onSubmit: SubmitHandler<ValorarConsultaFormValues> = async (data) => {
    setApiError(null);
    try {
      await valorarConsulta(consulta.id, data);
      enqueueSnackbar("Consulta valorada correctamente", {
        variant: "success",
      });
      onSave(); // Avisa a la página que refresque
      handleClose(); // Cierra el modal
    } catch (err: any) {
      setApiError(err.message || "Error al valorar la consulta.");
      enqueueSnackbar(err.message || "Error al valorar la consulta.", {
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Valorar Respuesta</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Valoración (Estrellas) */}
            <FormControl error={!!errors.valoracion}>
              <Typography component="legend">Valoración (Requerido)</Typography>
              <Controller
                name="valoracion"
                control={control}
                render={({ field }) => (
                  <Rating
                    {...field}
                    onChange={(e, newValue) => field.onChange(newValue)}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FormHelperText sx={{ minHeight: "1.25em" }}>
                {errors.valoracion?.message || " "}
              </FormHelperText>
            </FormControl>

            {/* Comentario (Opcional) */}
            <Controller
              name="comentarioValoracion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Comentario (Opcional)"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.comentarioValoracion}
                  helperText={errors.comentarioValoracion?.message || " "}
                  disabled={isSubmitting}
                />
              )}
            />
            {apiError && <Alert severity="error">{apiError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Enviar Valoración"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
