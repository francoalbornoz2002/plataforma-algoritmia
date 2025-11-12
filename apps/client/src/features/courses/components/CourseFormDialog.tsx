// src/pages/Courses/CourseFormDialog.tsx

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
  CircularProgress,
  Grid,
  Alert,
  Autocomplete,
  Checkbox,
  ListItemText,
  Typography,
  IconButton,
  Box,
  Input, // Para la subida de archivo
  Stack,
  FormHelperText,
  styled,
  Divider, // Para el layout de diasClase
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  createCourse,
  updateCourse,
  findCourseById,
  findDocentesParaFiltro, // Necesitamos esto aquí también
} from "../services/courses.service";
import {
  type CreateCourseData,
  type UpdateCourseData,
  type DocenteParaFiltro,
  modalidad,
  dias_semana,
  type CursoParaEditar,
} from "../../../types";
import {
  courseFormSchema,
  type CourseFormValues,
} from "../validations/course.schema";
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enqueueSnackbar } from "notistack";

const VisuallyHiddenInput = styled(Input)({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface CourseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para notificar a la página principal que debe recargar
  courseToEditId: string | null;
}

// --- Valores por defecto para RHF ---
const defaultValues: CourseFormValues = {
  nombre: "",
  descripcion: "",
  contrasenaAcceso: "",
  modalidadPreferencial: modalidad.Presencial,
  docentes: [],
  diasClase: [],
  imagen: null,
};

export default function CourseFormDialog({
  open,
  onClose,
  onSave,
  courseToEditId,
}: CourseFormDialogProps) {
  const isEditMode = !!courseToEditId;

  // (Estados para datos que no son del formulario)
  const [allDocentes, setAllDocentes] = useState<DocenteParaFiltro[]>([]);
  const [docentesLoading, setDocentesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para el fetch inicial
  const [error, setError] = useState<string | null>(null); // Para errores de API

  // (Estados para el archivo y su previsualización)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- INICIALIZACIÓN DE REACT HOOK FORM ---
  const {
    control, // Objeto para conectar componentes de MUI
    register, // Para campos nativos
    handleSubmit, // Wrapper para el submit
    reset, // Para resetear el form (con datos de edición o por defecto)
    setValue, // Para setear valores manualmente (ej: imagen)
    formState: { errors, isSubmitting }, // Reemplaza 'isSaving' y maneja errores
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  // --- MANEJO DE DÍAS DE CLASE (useFieldArray) ---
  const {
    fields: diasClaseFields,
    append: appendDiaClase,
    remove: removeDiaClase,
  } = useFieldArray({
    control,
    name: "diasClase",
  });

  // --- EFFECT: Cargar todos los docentes (para el Autocomplete) ---
  useEffect(() => {
    if (open) {
      const fetchDocentes = async () => {
        setDocentesLoading(true);
        try {
          const docentesData = await findDocentesParaFiltro();
          setAllDocentes(docentesData);
        } catch (err) {
          console.error("Error al cargar lista de docentes:", err);
        } finally {
          setDocentesLoading(false);
        }
      };
      fetchDocentes();
    }
  }, [open]);

  // --- EFFECT: Cargar datos del curso si estamos en modo edición ---
  useEffect(() => {
    const fetchCourseData = async () => {
      if (isEditMode && open) {
        setIsLoading(true);
        setError(null);
        try {
          const course: CursoParaEditar = await findCourseById(courseToEditId);

          // Preparamos los datos para que coincidan con el schema
          const formValues: CourseFormValues = {
            nombre: course.nombre,
            descripcion: course.descripcion,
            contrasenaAcceso: course.contrasenaAcceso,
            modalidadPreferencial: course.modalidadPreferencial,
            docentes: course.docentes,
            diasClase: course.diasClase.map((dia) => ({ ...dia })), // RHF maneja IDs
            imagen: null, // La imagen se maneja por separado
          };

          // ¡Reseteamos todo el formulario con los datos cargados!
          reset(formValues);

          if (course.imagenUrl) {
            setPreviewImage(course.imagenUrl);
          }
          setSelectedFile(null);
        } catch (err: any) {
          setError(err.message || "Error al cargar datos del curso.");
        } finally {
          setIsLoading(false);
        }
      } else if (open) {
        // Si abrimos en modo "Crear", reseteamos a los valores por defecto
        reset(defaultValues);
        setSelectedFile(null);
        setPreviewImage(null);
        setError(null);
      }
    };
    fetchCourseData();
  }, [courseToEditId, open, isEditMode, reset]); // 'reset' es una dependencia

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file); // Aún lo necesitamos para el FormData
      setValue("imagen", file, { shouldValidate: true }); // Setea el valor en RHF
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // --- Handler de Submit (NUEVO) ---
  // RHF llama a esta función SÓLO SI la validación (Zod) pasa
  const onSubmit: SubmitHandler<CourseFormValues> = async (data) => {
    setError(null); // Limpiar errores de API previos

    // 1. Preparar datos (RHF ya nos da el objeto 'data' validado)
    const docenteIds = data.docentes.map((d) => d.id);
    // Los días de clase ya tienen el formato { id: string | null, ... }
    const diasClaseLimpios = data.diasClase;

    try {
      if (isEditMode) {
        const updateData: UpdateCourseData = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          contrasenaAcceso: data.contrasenaAcceso,
          modalidadPreferencial: data.modalidadPreferencial,
          docenteIds,
          diasClase: diasClaseLimpios,
        };
        // 'selectedFile' sigue viniendo del state
        await updateCourse(courseToEditId, updateData, selectedFile);
        enqueueSnackbar("Curso actualizado con éxito", {
          variant: "success",
          autoHideDuration: 3000,
        });
      } else {
        const createData: CreateCourseData = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          contrasenaAcceso: data.contrasenaAcceso,
          modalidadPreferencial: data.modalidadPreferencial,
          docenteIds,
          diasClase: diasClaseLimpios,
        };
        await createCourse(createData, selectedFile);
        enqueueSnackbar("Curso creado con éxito", {
          variant: "success",
          autoHideDuration: 3000,
        });
      }
      onSave(); // Notifica a la página principal
    } catch (err: any) {
      if (isEditMode) {
        setError(err.message || "Ocurrió un error al guardar.");
        enqueueSnackbar("Error al actualizar el curso", {
          variant: "error",
          autoHideDuration: 3000,
        });
      } else {
        setError(err.message || "Ocurrió un error al guardar.");
        enqueueSnackbar("Error al crear el curso", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    }
    // 'isSubmitting' se pone en 'false' automáticamente
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle align="center">
        {isEditMode ? "Editar Curso" : "Añadir Nuevo Curso"}
      </DialogTitle>
      <Divider variant="middle" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* --- Columna Izquierda: Datos Principales --- */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={2}>
                  <TextField
                    {...register("nombre")} // Conecta RHF
                    label="Nombre del Curso"
                    fullWidth
                    required
                    disabled={isSubmitting}
                    error={!!errors.nombre} // Muestra error de Zod
                    helperText={errors.nombre?.message} // Muestra mensaje de Zod
                  />
                  <TextField
                    {...register("descripcion")}
                    label="Descripción"
                    fullWidth
                    multiline
                    rows={3}
                    required
                    disabled={isSubmitting}
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                  <TextField
                    {...register("contrasenaAcceso")}
                    label="Contraseña de Acceso"
                    fullWidth
                    required
                    disabled={isSubmitting}
                    type="password"
                    error={!!errors.contrasenaAcceso}
                    helperText={errors.contrasenaAcceso?.message}
                  />
                  {/* --- CAMPO 'docentes' (con RHF Controller) --- */}
                  <Controller
                    name="docentes"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        multiple
                        options={allDocentes}
                        loading={docentesLoading}
                        value={value || []} // RHF maneja el valor
                        onChange={(e, newValue) => onChange(newValue)} // RHF maneja el cambio
                        disableCloseOnSelect
                        getOptionLabel={(o) => `${o.nombre} ${o.apellido}`}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        renderOption={(props, option, { selected }) => {
                          const { key, ...liProps } = props as any;
                          return (
                            <li key={key} {...liProps}>
                              <Checkbox
                                style={{ marginRight: 8 }}
                                checked={selected}
                              />
                              <ListItemText
                                primary={`${option.nombre} ${option.apellido}`}
                              />
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Docentes a asignar"
                            placeholder="Buscar docente..."
                            error={!!errors.docentes}
                            helperText={errors.docentes?.message}
                            required
                          />
                        )}
                      />
                    )}
                  />
                  {/* --- CAMPO 'modalidadPreferencial' (con RHF Controller) --- */}
                  <Controller
                    name="modalidadPreferencial"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={!!errors.modalidadPreferencial}
                        required
                      >
                        <InputLabel>Modalidad preferencial</InputLabel>
                        <Select
                          {...field} // RHF maneja 'value', 'onChange', 'name'
                          label="Modalidad (Consultas)"
                          disabled={isSubmitting}
                        >
                          <MenuItem value={modalidad.Presencial}>
                            Presencial
                          </MenuItem>
                          <MenuItem value={modalidad.Virtual}>Virtual</MenuItem>
                        </Select>
                        <FormHelperText error={!!errors.modalidadPreferencial}>
                          {errors.modalidadPreferencial?.message ||
                            "Para clases de consulta automáticas"}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Stack>
              </Grid>

              {/* --- Columna Derecha: Imagen --- */}
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth error={!!errors.imagen}>
                  <Box
                    sx={{
                      border: "1px dashed grey",
                      borderRadius: 1,
                      p: 2,
                      textAlign: "center",
                      height: 170,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {/* El preview sigue usando el state local */}
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Previsualización"
                        style={{
                          maxHeight: "100%",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Imagen para el Curso
                      </Typography>
                    )}
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                    disabled={isSubmitting}
                  >
                    Seleccionar Archivo
                    <VisuallyHiddenInput
                      type="file"
                      // Registramos la imagen, pero el onChange es manual
                      {...register("imagen")}
                      onChange={handleFileChange}
                      inputProps={{
                        accept: "image/*",
                      }}
                    />
                  </Button>
                  <FormHelperText error={!!errors.imagen}>
                    {errors.imagen?.message as string}
                  </FormHelperText>
                </FormControl>
              </Grid>

              {/* --- Fila Inferior: Días de Clase (con useFieldArray) --- */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Días de Clase
                  </Typography>
                  <Stack sx={{ mt: 2 }} spacing={2}>
                    {/* Iteramos sobre los 'fields' de useFieldArray */}
                    {diasClaseFields.map((field, index) => (
                      <Stack
                        key={field.id} // RHF provee el 'key'
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems="center"
                      >
                        {/* Cada campo se registra con su índice */}
                        <FormControl
                          size="small"
                          sx={{ minWidth: 130, flex: 1.5 }}
                          error={!!errors.diasClase?.[index]?.dia}
                        >
                          <InputLabel>Día</InputLabel>
                          <Controller
                            name={`diasClase.${index}.dia`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} label="Día">
                                {Object.values(dias_semana).map((d) => (
                                  <MenuItem key={d} value={d}>
                                    {d}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </FormControl>
                        <TextField
                          {...register(`diasClase.${index}.horaInicio`)}
                          label="Inicio"
                          type="time"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ flex: 1 }}
                          error={!!errors.diasClase?.[index]?.horaInicio}
                        />
                        <TextField
                          {...register(`diasClase.${index}.horaFin`)}
                          label="Fin"
                          type="time"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ flex: 1 }}
                          error={!!errors.diasClase?.[index]?.horaFin}
                        />
                        <FormControl
                          size="small"
                          sx={{ minWidth: 130, flex: 1 }}
                          error={!!errors.diasClase?.[index]?.modalidad}
                        >
                          <InputLabel>Modalidad</InputLabel>
                          <Controller
                            name={`diasClase.${index}.modalidad`}
                            control={control}
                            render={({ field }) => (
                              <Select {...field} label="Modalidad">
                                <MenuItem value={modalidad.Presencial}>
                                  Presencial
                                </MenuItem>
                                <MenuItem value={modalidad.Virtual}>
                                  Virtual
                                </MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                        <IconButton
                          onClick={() => removeDiaClase(index)} // RHF maneja el borrado
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      onClick={() =>
                        // RHF maneja añadir el objeto
                        appendDiaClase({
                          id: null,
                          dia: dias_semana.Lunes,
                          horaInicio: "09:00",
                          horaFin: "11:00",
                          modalidad: modalidad.Presencial,
                        })
                      }
                      disabled={isSubmitting}
                    >
                      Añadir Día de Clase
                    </Button>
                    {errors.diasClase && (
                      <FormHelperText error sx={{ ml: 2 }}>
                        {errors.diasClase.message}
                      </FormHelperText>
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isEditMode ? "Actualizar" : "Crear curso"}
            {/* 'isSubmitting' reemplaza a 'isSaving' */}
            {isSubmitting ? <CircularProgress size={24} sx={{ ml: 1 }} /> : ""}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
