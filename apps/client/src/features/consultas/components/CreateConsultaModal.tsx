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
import { useState } from "react";
import { temas } from "../../../types"; // Ajusta la ruta a 'types'
import {
  createConsultaSchema,
  type CreateConsultaFormValues,
} from "../validations/consulta.schema"; // El schema que ya creamos

interface CreateConsultaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para refrescar la lista
  idCurso: string; // El curso actual
}

// (Importamos el servicio)
import { createConsulta } from "../../users/services/alumnos.service";

export default function CreateConsultaModal({
  open,
  onClose,
  onSave,
  idCurso,
}: CreateConsultaModalProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateConsultaFormValues>({
    resolver: zodResolver(createConsultaSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      tema: undefined, // Empezar sin tema seleccionado
    },
  });

  // Limpiamos el form cuando se cierra
  const handleClose = () => {
    onClose();
    reset();
    setApiError(null);
  };

  const onSubmit: SubmitHandler<CreateConsultaFormValues> = async (data) => {
    setApiError(null);
    try {
      // Llamamos al servicio (con la ruta /create que definiste)
      await createConsulta(idCurso, data);
      onSave(); // Avisa a la página que refresque
      handleClose(); // Cierra el modal
    } catch (err: any) {
      setApiError(err.message || "Error al crear la consulta.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Realizar una Nueva Consulta</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
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
                  helperText={errors.titulo?.message}
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
              <FormHelperText>{errors.tema?.message as string}</FormHelperText>
            </FormControl>
            {/* Descripción */}
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Describe tu duda..."
                  fullWidth
                  required
                  multiline
                  rows={4}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion?.message}
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
            {isSubmitting ? <CircularProgress size={24} /> : "Enviar Consulta"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
