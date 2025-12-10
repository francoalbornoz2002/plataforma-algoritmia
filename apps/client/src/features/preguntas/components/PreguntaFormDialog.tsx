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
  Typography,
  IconButton,
  Tooltip,
  Radio,
} from "@mui/material";
import {
  useForm,
  Controller,
  useFieldArray,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import {
  temas,
  grado_dificultad,
  type PreguntaConDetalles,
  type DificultadConTema,
} from "../../../types";
import {
  preguntaFormSchema,
  type PreguntaFormValues,
} from "../validations/pregunta.schema";
import { preguntasService } from "../service/preguntas.service";
import { getAllDifficulties } from "../../users/services/docentes.service";

interface PreguntaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  preguntaToEdit: PreguntaConDetalles | null;
}

const defaultValues: PreguntaFormValues = {
  tema: "",
  enunciado: "",
  idDificultad: "",
  gradoDificultad: grado_dificultad.Bajo,
  opcionesRespuesta: [
    { textoOpcion: "", esCorrecta: true },
    { textoOpcion: "", esCorrecta: false },
  ],
};

export default function PreguntaFormDialog({
  open,
  onClose,
  onSave,
  preguntaToEdit,
}: PreguntaFormDialogProps) {
  const isEditMode = !!preguntaToEdit;

  // Estados para la lógica del componente
  const [allDificultades, setAllDificultades] = useState<DificultadConTema[]>(
    []
  );
  const [filteredDificultades, setFilteredDificultades] = useState<
    DificultadConTema[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<PreguntaFormValues>({
    resolver: zodResolver(preguntaFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const selectedTema = watch("tema");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "opcionesRespuesta",
  });

  // Efecto para cargar las dificultades al abrir el modal
  useEffect(() => {
    if (open) {
      const fetchDificultades = async () => {
        setIsLoading(true);
        try {
          // Usamos el método para obtener todas las dificultades con su tema asociado.
          const data = await getAllDifficulties();
          setAllDificultades(data);
        } catch (err) {
          enqueueSnackbar("Error al cargar las dificultades", {
            variant: "error",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchDificultades();
    }
  }, [open]);

  // Efecto para filtrar dificultades cuando cambia el tema seleccionado
  useEffect(() => {
    const newFiltered = selectedTema
      ? allDificultades.filter((d) => d.tema === selectedTema)
      : [];
    setFilteredDificultades(newFiltered);

    // Si la dificultad seleccionada actualmente ya no es válida para el tema
    // elegido (o si se deseleccionó el tema), la reseteamos.
    // Esto es crucial para que al cambiar de tema, el campo de dificultad se limpie,
    // pero no al cargar el formulario en modo edición.
    const currentDificultadId = watch("idDificultad");
    if (
      currentDificultadId &&
      !newFiltered.some((d) => d.id === currentDificultadId)
    ) {
      setValue("idDificultad", "", { shouldValidate: true });
    }
  }, [selectedTema, allDificultades, setValue, watch]);

  // Efecto para resetear el formulario al abrir/cerrar o si cambia el objeto a editar
  useEffect(() => {
    if (open) {
      if (isEditMode && preguntaToEdit) {
        reset({
          tema: preguntaToEdit.dificultad.tema,
          enunciado: preguntaToEdit.enunciado,
          idDificultad: preguntaToEdit.idDificultad,
          gradoDificultad: preguntaToEdit.gradoDificultad,
          opcionesRespuesta: preguntaToEdit.opcionesRespuesta.map((op) => ({
            textoOpcion: op.textoOpcion,
            esCorrecta: op.esCorrecta,
          })),
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, isEditMode, preguntaToEdit, reset]);

  const handleCorrectOptionChange = (selectedIndex: number) => {
    const currentOptions = watch("opcionesRespuesta");
    const newOptions = currentOptions.map((option, index) => ({
      ...option,
      esCorrecta: index === selectedIndex,
    }));
    setValue("opcionesRespuesta", newOptions, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<PreguntaFormValues> = async (data) => {
    // Omitimos el campo 'tema' que solo se usa en el frontend para filtrar.
    const { tema, ...dataToSend } = data;

    try {
      if (isEditMode && preguntaToEdit) {
        await preguntasService.update(preguntaToEdit.id, dataToSend);
        enqueueSnackbar("Pregunta actualizada correctamente", {
          variant: "success",
        });
      } else {
        await preguntasService.create(dataToSend);
        enqueueSnackbar("Pregunta creada correctamente", {
          variant: "success",
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      const message =
        err.message ||
        (isEditMode
          ? "Error al actualizar la pregunta."
          : "Error al crear la pregunta.");
      enqueueSnackbar(message, {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle align="center">
        {isEditMode ? "Editar Pregunta" : "Crear Nueva Pregunta"}
      </DialogTitle>
      <Divider variant="middle" />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="tema"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.tema}>
                      <InputLabel>Tema *</InputLabel>
                      <Select
                        {...field}
                        label="Tema"
                        disabled={isSubmitting}
                        required
                      >
                        {Object.values(temas)
                          .filter((t) => t !== temas.Ninguno)
                          .map((tema) => (
                            <MenuItem key={tema} value={tema}>
                              {tema}
                            </MenuItem>
                          ))}
                      </Select>
                      <FormHelperText>
                        {errors.tema?.message || "Filtro para las dificultades"}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
                <Controller
                  name="idDificultad"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.idDificultad}>
                      <InputLabel>Dificultad *</InputLabel>
                      <Select
                        {...field}
                        label="Dificultad"
                        disabled={isSubmitting || !selectedTema}
                        required
                      >
                        {filteredDificultades.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {errors.idDificultad?.message || " "}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
                <Controller
                  name="gradoDificultad"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.gradoDificultad}>
                      <InputLabel>Grado *</InputLabel>
                      <Select {...field} label="Grado" disabled={isSubmitting}>
                        {Object.values(grado_dificultad)
                          .filter((g) => g !== grado_dificultad.Ninguno)
                          .map((g) => (
                            <MenuItem key={g} value={g}>
                              {g}
                            </MenuItem>
                          ))}
                      </Select>
                      <FormHelperText>
                        {errors.gradoDificultad?.message || " "}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Stack>
              <Controller
                name="enunciado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Enunciado de la pregunta"
                    fullWidth
                    required
                    multiline
                    rows={2}
                    error={!!errors.enunciado}
                    helperText={errors.enunciado?.message || " "}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Divider />
              <FormControl
                component="fieldset"
                error={!!errors.opcionesRespuesta}
              >
                <Typography variant="h6" gutterBottom>
                  Opciones de Respuesta
                </Typography>
                <Stack spacing={2}>
                  {fields.map((field, index) => (
                    <Stack
                      key={field.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Tooltip title="Marcar como correcta">
                        <Radio
                          checked={
                            watch("opcionesRespuesta")[index]?.esCorrecta
                          }
                          onChange={() => handleCorrectOptionChange(index)}
                          disabled={isSubmitting}
                        />
                      </Tooltip>
                      <Controller
                        name={`opcionesRespuesta.${index}.textoOpcion`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field} // Mantiene las props originales (value, onBlur, etc.)
                            onChange={(e) => {
                              field.onChange(e); // Actualiza el valor del campo
                              trigger("opcionesRespuesta"); // Dispara la validación de todo el array de opciones
                            }}
                            label={`Opción ${index + 1}`}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                            error={
                              !!errors.opcionesRespuesta?.[index]?.textoOpcion
                            }
                            helperText={
                              errors.opcionesRespuesta?.[index]?.textoOpcion
                                ?.message || " "
                            }
                          />
                        )}
                      />
                      {fields.length > 2 && (
                        <IconButton
                          onClick={() => remove(index)}
                          color="error"
                          disabled={isSubmitting}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>
                <FormHelperText sx={{ mt: 1, ml: 2 }}>
                  {errors.opcionesRespuesta?.message ||
                    errors.opcionesRespuesta?.root?.message ||
                    " "}
                </FormHelperText>
                {fields.length < 4 && (
                  <Button
                    onClick={() =>
                      append({ textoOpcion: "", esCorrecta: false })
                    }
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ mt: 1, alignSelf: "flex-start" }}
                    disabled={isSubmitting}
                  >
                    Añadir Opción
                  </Button>
                )}
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              "Guardar Cambios"
            ) : (
              "Crear Pregunta"
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
