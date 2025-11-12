import { useEffect, useState } from "react";
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
  Autocomplete, // <-- Usaremos Autocomplete para las consultas
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { format } from "date-fns";

// Tipos, Schemas y Servicios
import {
  type DocenteBasico,
  type ConsultaSimple,
  type ClaseConsulta,
  modalidad,
} from "../../../types";
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

interface ClaseConsultaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  claseToEdit: ClaseConsulta | null; // null = Modo Creación
  // Datos precargados
  docentesList: DocenteBasico[];
  consultasList: ConsultaSimple[];
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

  const isEditMode = !!claseToEdit;
  const schema = isEditMode
    ? updateClaseConsultaSchema
    : createClaseConsultaSchema;

  const {
    control,
    handleSubmit,
    reset,
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
      modalidad: undefined,
      consultasIds: [],
    },
  });

  // Efecto para rellenar el form si es Modo Edición
  useEffect(() => {
    if (claseToEdit) {
      reset({
        nombre: claseToEdit.nombre,
        descripcion: claseToEdit.descripcion,
        fechaClase: new Date(claseToEdit.fechaClase).toISOString(),
        horaInicio: format(new Date(claseToEdit.horaInicio), "HH:mm"),
        horaFin: format(new Date(claseToEdit.horaFin), "HH:mm"),
        idDocente: claseToEdit.idDocente,
        modalidad: claseToEdit.modalidad,
        consultasIds: claseToEdit.consultasEnClase.map((c) => c.consulta.id),
      });
    } else {
      reset({
        nombre: "",
        descripcion: "",
        fechaClase: "",
        horaInicio: "",
        horaFin: "",
        idDocente: "",
        modalidad: modalidad.Presencial,
        consultasIds: [],
      }); // Reset a defaults de Zod
    }
  }, [claseToEdit, reset, schema]);

  const handleClose = () => {
    onClose();
    reset();
    setApiError(null);
  };

  const onSubmit: SubmitHandler<UpdateClaseConsultaFormValues> = async (
    data
  ) => {
    setApiError(null);
    if (!selectedCourse) {
      setApiError("No hay un curso seleccionado.");
      return;
    }

    try {
      if (isEditMode) {
        // Modo Edición
        await updateClaseConsulta(claseToEdit!.id, data);
      } else {
        // Modo Creación
        await createClaseConsulta(
          data as CreateClaseConsultaFormValues, // <-- Forzamos el tipo
          selectedCourse.id
        );
      }
      onSave(); // Refresca la lista en la página
      handleClose(); // Cierra el modal
    } catch (err: any) {
      setApiError(err.message || "Error al guardar la clase.");
    }
  };

  // Convertimos las consultas simples al formato que Autocomplete espera
  const autocompleteOptions = consultasList.map((c) => ({
    id: c.id,
    label: `${c.alumno.nombre} ${c.alumno.apellido} - ${c.titulo}`,
  }));

  return (
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
                    disablePast
                    value={field.value ? new Date(field.value) : null}
                    onChange={(newDate) =>
                      field.onChange(newDate?.toISOString())
                    }
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
                    value={
                      field.value
                        ? new Date(`1970-01-01T${field.value}:00`)
                        : null
                    }
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
                    value={
                      field.value
                        ? new Date(`1970-01-01T${field.value}:00`)
                        : null
                    }
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

            {/* Fila 4: Selector de Consultas */}
            <FormControl fullWidth error={!!errors.consultasIds}>
              <Controller
                name="consultasIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={autocompleteOptions}
                    getOptionLabel={(option) => option.label}
                    value={autocompleteOptions.filter((opt) =>
                      (field.value || []).includes(opt.id)
                    )}
                    onChange={(event, newValue) => {
                      field.onChange(newValue.map((v) => v.id));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Consultas a Revisar (Mín. 5)"
                        error={!!errors.consultasIds}
                      />
                    )}
                    renderOption={(props, option, { selected }) => {
                      const { key, ...restProps } = props as any;
                      return (
                        <li key={option.id} {...restProps}>
                          <Checkbox checked={selected} />
                          <ListItemText primary={option.label} />
                        </li>
                      );
                    }}
                  />
                )}
              />
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
  );
}
