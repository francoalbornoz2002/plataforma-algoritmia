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
  Alert,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { temas, type Consulta } from "../../../types";
import {
  updateConsultaSchema,
  type UpdateConsultaFormValues,
} from "../validations/consulta.schema";

// Importamos el servicio de UPDATE
import { updateConsulta } from "../../users/services/alumnos.service";

interface EditConsultaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para refrescar la lista
  consultaToEdit: Consulta; // La consulta que vamos a editar
}

export default function EditConsultaModal({
  open,
  onClose,
  onSave,
  consultaToEdit,
}: EditConsultaModalProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateConsultaFormValues>({
    resolver: zodResolver(updateConsultaSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      tema: undefined,
    },
  });

  // Efecto para rellenar el formulario cuando 'consultaToEdit' cambia
  useEffect(() => {
    if (consultaToEdit) {
      reset({
        titulo: consultaToEdit.titulo,
        descripcion: consultaToEdit.descripcion,
        tema: consultaToEdit.tema,
      });
    }
  }, [consultaToEdit, reset]);

  const handleClose = () => {
    onClose();
    setApiError(null);
    // No reseteamos el form aquí, 'useEffect' lo hará
  };

  const onSubmit: SubmitHandler<UpdateConsultaFormValues> = async (data) => {
    setApiError(null);
    try {
      // Llamamos al servicio de ACTUALIZACIÓN
      await updateConsulta(consultaToEdit.id, data);
      onSave();
      handleClose();
    } catch (err: any) {
      setApiError(err.message || "Error al actualizar la consulta.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Consulta</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* ... (Los 3 campos: Título, Tema, Descripción son idénticos al Create) ... */}
            {/* Título */}
            <Controller
              name="titulo"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Título" /* ... */ />
              )}
            />
            {/* Tema */}
            <FormControl fullWidth error={!!errors.tema}>
              <InputLabel>Tema Relacionado</InputLabel>
              <Controller
                name="tema"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Tema Relacionado">
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
              <FormHelperText>{errors.tema?.message as string}</FormHelperText>
            </FormControl>
            {/* Descripción */}
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descripción"
                  multiline
                  rows={4} /* ... */
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
            {isSubmitting ? <CircularProgress size={24} /> : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
