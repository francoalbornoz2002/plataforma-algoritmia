import { useEffect, useState, useMemo } from "react";
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
  Typography,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { format, addDays } from "date-fns";

// Tipos, Schemas y Servicios
import {
  type DocenteBasico,
  type ConsultaSimple,
  type ClaseConsulta,
  modalidad,
} from "../../../types"; // Ajusta la ruta a 'types'
import {
  createClaseConsultaSchema,
  updateClaseConsultaSchema,
  type CreateClaseConsultaFormValues,
  type UpdateClaseConsultaFormValues,
} from "../validations/clase-consulta.schema";
import {
  createClaseConsulta,
  updateClaseConsulta,
} from "../services/clases-consulta.service";
import { useCourseContext } from "../../../context/CourseContext";
import { timeToDate } from "../../../utils/dateHelpers"; // El helper que creamos

// El modal de selección que ya arreglamos
import ConsultaSelectionModal from "./ConsultaSelectionModal";
import { enqueueSnackbar } from "notistack";

interface ClaseConsultaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  claseToEdit: ClaseConsulta | null; // null = Modo Creación
  // Datos precargados
  docentesList: DocenteBasico[];
  consultasList: ConsultaSimple[]; // Lista de "Pendientes"
}

export default function ClaseConsultaFormModal({
  open,
  onClose,
  onSave,
  claseToEdit,
  docentesList,
  consultasList,
}: ClaseConsultaFormModalProps) {
  const { selectedCourse } = useCourseContext();
  const [apiError, setApiError] = useState<string | null>(null);

  // Estado para controlar el modal de selección
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  const isEditMode = !!claseToEdit;
  // El schema se elige dinámicamente
  const schema = isEditMode
    ? updateClaseConsultaSchema
    : createClaseConsultaSchema;

  // 1. useForm (Corregido para usar el tipo Parcial como base)
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateClaseConsultaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      fechaClase: "",
      horaInicio: "",
      horaFin: "",
      idDocente: "",
      modalidad: modalidad.Presencial,
      consultasIds: [], // El 'default' es string[]
    },
  });

  // "Escuchamos" el campo consultasIds para mostrar el contador
  const consultasIdsValue = watch("consultasIds") || [];

  // 2. useEffect de 'reset' (Corregido)
  useEffect(() => {
    if (isEditMode && claseToEdit) {
      // Modo Edición
      reset({
        nombre: claseToEdit.nombre,
        descripcion: claseToEdit.descripcion,
        fechaClase: new Date(claseToEdit.fechaClase).toISOString(),
        horaInicio: format(new Date(claseToEdit.horaInicio), "HH:mm"),
        horaFin: format(new Date(claseToEdit.horaFin), "HH:mm"),
        idDocente: claseToEdit.idDocente,
        modalidad: claseToEdit.modalidad,
        // Guardamos solo los IDs (string[])
        consultasIds: claseToEdit.consultasEnClase.map((c) => c.consulta.id),
      });
    } else {
      // Modo Creación
      reset({
        nombre: "",
        descripcion: "",
        fechaClase: "",
        horaInicio: "",
        horaFin: "",
        idDocente: "",
        modalidad: modalidad.Presencial,
        consultasIds: [],
      });
    }
  }, [claseToEdit, isEditMode, reset]);

  // Handler para cerrar el modal principal
  const handleClose = () => {
    onClose();
    reset();
    setApiError(null);
  };

  // 3. onSubmit (Corregido)
  const onSubmit: SubmitHandler<UpdateClaseConsultaFormValues> = async (
    data
  ) => {
    setApiError(null);
    if (!selectedCourse) {
      setApiError("No hay un curso seleccionado.");
      return;
    }

    // El payload ya es correcto
    const payload = {
      ...data,
      consultasIds: data.consultasIds || [],
    };

    try {
      if (isEditMode) {
        await updateClaseConsulta(claseToEdit!.id, payload);
        enqueueSnackbar("Clase actualizada correctamente", {
          variant: "success",
        });
      } else {
        await createClaseConsulta(
          payload as CreateClaseConsultaFormValues, // Forzamos el tipo (Zod ya validó)
          selectedCourse.id
        );
        enqueueSnackbar("Clase de cosnulta creada correctamente", {
          variant: "success",
        });
      }
      onSave(); // Refresca la lista en la página
      handleClose(); // Cierra el modal
    } catch (err: any) {
      setApiError(err.message || "Error al guardar la clase.");
      enqueueSnackbar(err.message || "Error al guardar la clase.", {
        variant: "error",
      });
    }
  };

  // 4. Callback para el modal de selección
  const handleConfirmSelection = (nuevosIds: string[]) => {
    // RHF guarda el string[]
    setValue("consultasIds", nuevosIds, { shouldValidate: true });
    setIsSelectModalOpen(false);
  };

  // 5. Opciones para el modal de selección (Autocomplete)
  // (Combina pendientes + ya seleccionadas)
  const mergedConsultasList = useMemo(() => {
    // Usamos un Map para evitar duplicados
    const optionsMap = new Map<string, ConsultaSimple>();

    // 1. Añadimos todas las 'Pendientes' (de consultasList)
    consultasList.forEach((c) => {
      optionsMap.set(c.id, c); // <-- Guardamos el objeto COMPLETO
    });

    // 2. Añadimos las 'Ya Seleccionadas' (de claseToEdit)
    if (isEditMode && claseToEdit) {
      claseToEdit.consultasEnClase.forEach((c) => {
        if (!optionsMap.has(c.consulta.id)) {
          // Guardamos el objeto COMPLETO
          optionsMap.set(c.consulta.id, c.consulta);
        }
      });
    }

    return Array.from(optionsMap.values()); // <-- Devolvemos ConsultaSimple[]
  }, [consultasList, claseToEdit, isEditMode]);

  // 6. Fecha máxima (Tu feature)
  const maxDate = addDays(new Date(), 7);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditMode ? "Editar" : "Crear"} Clase de Consulta
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Fila 1: Nombre y Docente */}
              <Stack direction="row" spacing={2}>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nombre de la Clase"
                      fullWidth
                      required
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                    />
                  )}
                />
                <FormControl fullWidth error={!!errors.idDocente}>
                  <InputLabel>Docente a Cargo</InputLabel>
                  <Controller
                    name="idDocente"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Docente a Cargo" required>
                        <MenuItem value="" disabled>
                          Seleccione un docente...
                        </MenuItem>
                        {docentesList.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.nombre} {d.apellido}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.idDocente?.message as string}
                  </FormHelperText>
                </FormControl>
              </Stack>

              {/* Fila 2: Fecha, Horas y Modalidad */}
              <Stack direction="row" spacing={2}>
                <Controller
                  name="fechaClase"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Fecha de la Clase"
                      value={field.value ? new Date(field.value) : null}
                      onChange={
                        (newDate) =>
                          field.onChange(
                            newDate ? format(newDate, "yyyy-MM-dd") : ""
                          ) // Guardamos string
                      }
                      maxDate={maxDate} // <-- Feature
                      disablePast // <-- Feature
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.fechaClase,
                          helperText: errors.fechaClase?.message as string,
                        },
                      }}
                    />
                  )}
                />
                <Controller
                  name="horaInicio"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Hora Inicio (HH:mm)"
                      ampm={false}
                      value={field.value ? timeToDate(field.value) : null}
                      onChange={(newDate) =>
                        field.onChange(newDate ? format(newDate, "HH:mm") : "")
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.horaInicio,
                          helperText: errors.horaInicio?.message as string,
                        },
                      }}
                    />
                  )}
                />
                <Controller
                  name="horaFin"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Hora Fin (HH:mm)"
                      ampm={false}
                      value={field.value ? timeToDate(field.value) : null}
                      onChange={(newDate) =>
                        field.onChange(newDate ? format(newDate, "HH:mm") : "")
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.horaFin,
                          helperText: errors.horaFin?.message as string,
                        },
                      }}
                    />
                  )}
                />
                <FormControl fullWidth error={!!errors.modalidad}>
                  <InputLabel>Modalidad</InputLabel>
                  <Controller
                    name="modalidad"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Modalidad" required>
                        <MenuItem value="" disabled>
                          Seleccione...
                        </MenuItem>
                        {Object.values(modalidad).map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.modalidad?.message as string}
                  </FormHelperText>
                </FormControl>
              </Stack>

              {/* Fila 3: Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    fullWidth
                    multiline
                    rows={3}
                    required
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                )}
              />

              {/* Fila 4: Selector de Consultas (Refactorizado) */}
              <FormControl fullWidth error={!!errors.consultasIds}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Consultas a Revisar*
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setIsSelectModalOpen(true)}
                >
                  Seleccionar Consultas ({consultasIdsValue.length}{" "}
                  seleccionadas)
                </Button>
                <FormHelperText>
                  {errors.consultasIds?.message as string}
                </FormHelperText>
              </FormControl>

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
              ) : isEditMode ? (
                "Guardar Cambios"
              ) : (
                "Crear Clase"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- RENDERIZAMOS EL MODAL DE SELECCIÓN --- */}
      <ConsultaSelectionModal
        open={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onConfirm={handleConfirmSelection}
        // Usamos las opciones combinadas
        consultasList={mergedConsultasList}
        initialSelection={consultasIdsValue} // Le pasamos los IDs seleccionados
      />
    </>
  );
}
