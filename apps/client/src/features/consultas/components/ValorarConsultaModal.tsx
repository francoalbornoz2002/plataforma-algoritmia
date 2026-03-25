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
  Divider,
  Box,
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

const valoracionFeedback: Record<
  number,
  { label: string; placeholder: string }
> = {
  1: {
    label: "No comprendí y no me sirvió",
    placeholder:
      "Ej: La explicación no aportó elementos útiles y no facilitó la resolución de la consulta.",
  },
  2: {
    label: "Comprendí muy poco y me sirvió mínimamente",
    placeholder:
      "Ej: La respuesta ofreció algún aporte limitado, pero no alcanzó para aclarar la duda.",
  },
  3: {
    label: "Comprendí parcialmente y me fue de cierta utilidad",
    placeholder:
      "Ej: La explicación ayudó de manera intermedia: aportó información pero no resolvió del todo la consulta.",
  },
  4: {
    label: "Comprendí casi todo y me fue útil",
    placeholder:
      "Ej: La respuesta resultó clara y permitió avanzar en la resolución de la duda con pequeñas limitaciones.",
  },
  5: {
    label: "Comprendí completamente y se resolvió mi consulta",
    placeholder: "Ej: La explicación fue totalmente clara y resolutiva.",
  },
};

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
  const [hover, setHover] = useState(-1);

  const {
    control,
    handleSubmit,
    reset,
    watch,
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

  const valoracionActual = watch("valoracion");
  const activeRating = hover !== -1 ? hover : valoracionActual;
  const currentFeedback =
    activeRating > 0 ? valoracionFeedback[activeRating] : null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle align="center" fontWeight="bold">
        Valorar Respuesta
      </DialogTitle>
      <Divider variant="middle" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={1}>
            {/* Valoración (Estrellas) */}
            <FormControl
              error={!!errors.valoracion}
              sx={{ alignItems: "center" }}
            >
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Valoración
              </Typography>
              <Controller
                name="valoracion"
                control={control}
                render={({ field }) => (
                  <Rating
                    {...field}
                    onChange={(e, newValue) => field.onChange(newValue)}
                    onChangeActive={(event, newHover) => {
                      setHover(newHover);
                    }}
                    disabled={isSubmitting}
                    size="large"
                  />
                )}
              />
              <Box sx={{ minHeight: 24, mt: 1 }}>
                {currentFeedback ? (
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight="medium"
                    textAlign="center"
                  >
                    {currentFeedback.label}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Pasa el cursor sobre las estrellas
                  </Typography>
                )}
              </Box>
              <FormHelperText sx={{ textAlign: "center" }}>
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
                  label={
                    currentFeedback
                      ? "Comentario (Opcional)"
                      : "Deja un comentario (Opcional)"
                  }
                  placeholder={
                    currentFeedback ? currentFeedback.placeholder : ""
                  }
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
