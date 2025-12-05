import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { temas, type Consulta } from "../../../types"; // Ajusta la ruta a 'types'
import {
  createConsultaSchema,
  updateConsultaSchema,
  type CreateConsultaFormValues,
  type UpdateConsultaFormValues,
} from "../validations/consulta.schema"; // El schema que ya creamos

interface ConsultaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para refrescar la lista
  idCurso?: string; // El curso actual, opcional para edición
  consultaToEdit: Consulta | null; // null si es creación
}

// (Importamos el servicio)
import {
  createConsulta,
  updateConsulta,
} from "../../users/services/alumnos.service";
import { enqueueSnackbar } from "notistack";

export default function ConsultaFormDialog({
  open,
  onClose,
  onSave,
  idCurso,
  consultaToEdit,
}: ConsultaFormDialogProps) {
  const isEditMode = Boolean(consultaToEdit);
  const [apiError, setApiError] = useState<string | null>(null);

  const currentSchema = isEditMode
    ? updateConsultaSchema
    : createConsultaSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateConsultaFormValues | UpdateConsultaFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      tema: undefined, // Empezar sin tema seleccionado
    },
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && consultaToEdit) {
        reset({
          titulo: consultaToEdit.titulo,
          descripcion: consultaToEdit.descripcion,
          tema: consultaToEdit.tema,
        });
      } else {
        reset({
          titulo: "",
          descripcion: "",
          tema: undefined,
        });
      }
    }
    setApiError(null);
  }, [open, consultaToEdit, isEditMode, reset]);

  // Limpiamos el form cuando se cierra
  const handleClose = () => {
    onClose();
    setApiError(null);
  };

  const onSubmit: SubmitHandler<
    CreateConsultaFormValues | UpdateConsultaFormValues
  > = async (data) => {
    setApiError(null);
    try {
      if (isEditMode && consultaToEdit) {
        await updateConsulta(consultaToEdit.id, data);
        enqueueSnackbar("Consulta actualizada correctamente", {
          variant: "success",
        });
      } else {
        if (!idCurso) {
          throw new Error(
            "El ID del curso es requerido para crear una consulta."
          );
        }
        await createConsulta(idCurso, data as CreateConsultaFormValues);
        enqueueSnackbar("Consulta creada correctamente", {
          variant: "success",
        });
      }
      onSave(); // Avisa a la página que refresque
      handleClose(); // Cierra el modal
    } catch (err: any) {
      const message =
        err.message ||
        (isEditMode
          ? "Error al actualizar la consulta."
          : "Error al crear la consulta.");
      setApiError(message);
      enqueueSnackbar(message, {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle align="center">
        {isEditMode ? "Editar Consulta" : "Realizar una Nueva Consulta"}
      </DialogTitle>
      <Divider variant="middle" />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Título */}
            <Controller
              name="titulo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Título de la consulta"
                  fullWidth
                  required
                  error={!!errors.titulo}
                  helperText={errors.titulo?.message || " "}
                  disabled={isSubmitting}
                />
              )}
            />
            {/* Tema */}
            <FormControl fullWidth error={!!errors.tema}>
              <InputLabel>Tema Relacionado</InputLabel>
              <Controller
                name="tema"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Tema Relacionado"
                    disabled={isSubmitting}
                  >
                    {/* Filtramos "Ninguno" */}
                    {Object.values(temas)
                      .filter((t) => t !== temas.Ninguno)
                      .map((tema) => (
                        <MenuItem key={tema} value={tema}>
                          {tema}
                        </MenuItem>
                      ))}
                  </Select>
                )}
              />
              <FormHelperText sx={{ minHeight: "1.25em" }}>
                {errors.tema?.message || " "}
              </FormHelperText>
            </FormControl>
            {/* Descripción */}
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Describe tu consulta..."
                  fullWidth
                  required
                  multiline
                  rows={4}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion?.message || " "}
                  disabled={isSubmitting}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              "Guardar Cambios"
            ) : (
              "Enviar Consulta"
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
