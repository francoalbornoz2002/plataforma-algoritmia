// src/components/users/UserFormDialog.tsx (Nuevo archivo)
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText"; // Para errores del Select
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { es } from "date-fns/locale/es";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Esquemas de validación, tipos y el tipo User base
import {
  createUserSchema,
  generos,
  rolesValues,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "../validations/user.schema";
import { roles, type UserData } from "../../../types";

// Servicios
import { createUser, updateUser } from "../services/user.service";
import { Box, Divider } from "@mui/material";

import { useSnackbar } from "notistack";

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  userToEdit: UserData | null; // null si es creación
  onSave: () => Promise<void>;
}

export default function UserFormDialog({
  open,
  onClose,
  userToEdit,
  onSave,
}: UserFormDialogProps) {
  const isEditMode = Boolean(userToEdit);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  // Selecciona el esquema de validación correcto
  const currentSchema = isEditMode ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    control,
    reset, // Para resetear el formulario
    formState: { errors, isSubmitting }, // isSubmitting para estado de carga
  } = useForm<CreateUserFormValues | UpdateUserFormValues>({
    // El tipo depende del modo
    resolver: zodResolver(currentSchema),
    defaultValues: {
      // Valores por defecto (importante para reset)
      nombre: "",
      apellido: "",
      dni: "",
      fechaNacimiento: undefined,
      genero: "Masculino",
      email: "",
      rol: undefined,
      password: "",
    },
  });

  // Efecto para resetear el formulario cuando cambia userToEdit o se abre/cierra
  useEffect(() => {
    if (open) {
      if (isEditMode && userToEdit) {
        // Carga datos para editar (convierte fecha si es string)
        reset({
          nombre: userToEdit.nombre || "",
          apellido: userToEdit.apellido || "",
          dni: userToEdit.dni || "",
          fechaNacimiento: userToEdit.fechaNacimiento
            ? new Date(userToEdit.fechaNacimiento)
            : undefined,
          genero: userToEdit.genero || "Otro",
          email: userToEdit.email || "", // Email no se edita, pero lo mostramos
          rol: userToEdit.rol,
          password: "", // Limpia password en modo edición
        });
      } else {
        // Resetea a valores por defecto para creación
        reset({
          nombre: "",
          apellido: "",
          dni: "",
          fechaNacimiento: new Date(),
          genero: "Masculino",
          email: "",
          rol: roles.Alumno,
          password: "",
        });
      }
    }
    setSubmitError(null); // Limpia errores al abrir/cambiar modo
  }, [open, userToEdit, isEditMode, reset]);

  const onSubmit: SubmitHandler<
    CreateUserFormValues | UpdateUserFormValues
  > = async (data) => {
    setSubmitError(null);
    try {
      const dataToSend = {
        ...data,
        // Asegura no enviar password vacío en update si no se quiere cambiar
        password: isEditMode && !data.password ? undefined : data.password,
      };

      if (isEditMode && userToEdit) {
        await updateUser(userToEdit.id, dataToSend as UpdateUserFormValues);
        enqueueSnackbar("Usuario actualizado con éxito", {
          variant: "success",
          autoHideDuration: 3000,
        });
      } else {
        await createUser(dataToSend as CreateUserFormValues);
        enqueueSnackbar("Usuario creado con éxito", {
          variant: "success",
          autoHideDuration: 3000,
        });
      }
      await onSave(); // Llama a la función para refrescar la tabla
    } catch (error: any) {
      console.error("Error saving user:", error);
      setSubmitError(
        error?.response?.data?.message ||
          error.message ||
          "Error al guardar el usuario."
      );
    }
  };

  if (submitError) {
    enqueueSnackbar(submitError, {
      variant: "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
    });
    setSubmitError(null);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle align="center">
        {isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
      </DialogTitle>
      <Divider variant="middle" />
      {/* Usamos handleSubmit aquí */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {/* Añade padding top */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Nombre"
                fullWidth
                required
                {...register("nombre")}
                error={!!errors.nombre}
                helperText={errors.nombre?.message || " "}
                slotProps={{
                  formHelperText: {
                    style: { minHeight: "1.25em" },
                  },
                }}
                disabled={isSubmitting}
              />
              <TextField
                label="Apellido"
                fullWidth
                required
                {...register("apellido")}
                error={!!errors.apellido}
                helperText={errors.apellido?.message || " "}
                slotProps={{
                  formHelperText: {
                    style: { minHeight: "1.25em" },
                  },
                }}
                disabled={isSubmitting}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="DNI"
                fullWidth
                required
                {...register("dni")}
                error={!!errors.dni}
                helperText={errors.dni?.message || " "}
                slotProps={{
                  formHelperText: {
                    style: { minHeight: "1.25em" },
                  },
                }}
                disabled={isSubmitting}
              />
              {/* DatePicker para Fecha de Nacimiento */}
              <Controller
                name="fechaNacimiento"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={es}
                  >
                    <DatePicker
                      label="Fecha de Nacimiento" // Asterisco si es requerido
                      format="dd/MM/yyyy"
                      value={field.value || null}
                      onChange={(date) => field.onChange(date)}
                      disabled={isSubmitting}
                      disableFuture
                      slotProps={{
                        textField: {
                          required: true, // Indica visualmente que es requerido
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message || " ",
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}
              />
              {/* Selector de Género */}
              <Controller
                name="genero"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth required error={!!error}>
                    <InputLabel id="genero-select-label">Género</InputLabel>
                    <Select
                      labelId="genero-select-label"
                      label="Género"
                      disabled={isSubmitting}
                      {...field}
                    >
                      {/* Mapea los valores del TIPO Género */}
                      {generos.map((genero) => (
                        <MenuItem key={genero} value={genero}>
                          {/* Puedes poner nombres más amigables aquí si quieres */}
                          {genero}
                        </MenuItem>
                      ))}
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Stack>
            <TextField
              label="Email"
              fullWidth
              required
              type="email"
              // Email deshabilitado en modo edición
              disabled={isEditMode || isSubmitting}
              slotProps={{
                input: {
                  readOnly: isEditMode,
                },
                formHelperText: {
                  style: { minHeight: "1.25em" },
                },
              }}
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message || " "}
            />
            {/* Campo Password (solo al crear) */}
            {!isEditMode && (
              <TextField
                label="Contraseña"
                fullWidth
                required={!isEditMode} // Requerido solo al crear
                type="password"
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message || " "}
                slotProps={{
                  formHelperText: {
                    style: { minHeight: "1.25em" },
                  },
                }}
                disabled={isSubmitting}
              />
            )}
            {/* Campo Password (opcional al editar) */}
            {isEditMode && (
              <TextField
                label="Nueva Contraseña (opcional)"
                fullWidth
                type="password"
                {...register("password")}
                error={!!errors.password}
                helperText={
                  errors.password?.message || "Dejar vacío para no cambiar"
                }
                slotProps={{
                  formHelperText: {
                    style: { minHeight: "1.25em" },
                  },
                }}
                disabled={isSubmitting}
              />
            )}
            {/* Selector de Rol */}
            <Controller
              name="rol"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth required error={!!error}>
                  <InputLabel id="rol-select-label">Rol</InputLabel>
                  <Select
                    labelId="rol-select-label"
                    label="Rol"
                    disabled={isSubmitting}
                    {...field}
                  >
                    {/* Mapea los valores del TIPO Rol */}
                    {rolesValues.map((rol) => (
                      <MenuItem key={rol} value={rol}>
                        {/* Puedes poner nombres más amigables aquí si quieres */}
                        {rol}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: "16px 24px" }}>
          {/* Añade padding */}
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              "Guardar Cambios"
            ) : (
              "Crear Usuario"
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
