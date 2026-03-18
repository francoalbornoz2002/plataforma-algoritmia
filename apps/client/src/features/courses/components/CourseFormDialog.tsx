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
  InputAdornment,
  Paper,
  Tooltip,
  Chip,
  OutlinedInput,
} from "@mui/material";
import {
  Add,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PersonSearch,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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
import SelectTeacherModal from "./SelectTeacherModal";

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
  isTeacherMode?: boolean; // <-- NUEVA PROP
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
  isTeacherMode = false, // Por defecto false (Admin)
}: CourseFormDialogProps) {
  const isEditMode = !!courseToEditId;
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  // (Estados para datos que no son del formulario)
  const [allDocentes, setAllDocentes] = useState<DocenteParaFiltro[]>([]);
  const [docentesLoading, setDocentesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para el fetch inicial
  const [error, setError] = useState<string | null>(null); // Para errores de API

  // (Estados para el archivo y su previsualización)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

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
            setPreviewImage(`${baseUrl}${course.imagenUrl}`);
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

    // Validar imagen si se seleccionó una nueva
    if (selectedFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(selectedFile.type)) {
        enqueueSnackbar("Solo se permiten archivos JPG, JPEG, PNG o GIF.", {
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        });
        return;
      }

      if (selectedFile.size > 2 * 1024 * 1024) {
        enqueueSnackbar("La imagen no debe superar los 2 MB.", {
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        });
        return;
      }
    }

    // 1. Preparar datos (RHF ya nos da el objeto 'data' validado)
    const docenteIds = data.docentes.map((d) => d.id);
    // Los días de clase ya tienen el formato { id: string | null, ... }
    const diasClaseLimpios = data.diasClase;

    try {
      if (isEditMode) {
        const updateData: UpdateCourseData = {
          descripcion: data.descripcion,
          contrasenaAcceso: data.contrasenaAcceso,
          modalidadPreferencial: data.modalidadPreferencial,
          diasClase: diasClaseLimpios,
        };

        // Solo enviamos nombre y docentes si NO es modo docente (es Admin)
        if (!isTeacherMode) {
          updateData.nombre = data.nombre;
          updateData.docenteIds = docenteIds;
        }

        // 'selectedFile' sigue viniendo del state
        await updateCourse(courseToEditId, updateData, selectedFile);
        if (!isTeacherMode) {
          enqueueSnackbar("Curso actualizado con éxito", {
            variant: "success",
            autoHideDuration: 3000,
          });
        }
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
    } catch (error: any) {
      console.error("Error al guardar el curso:", error);
      setError(
        error?.response?.data?.message ||
          error.message ||
          "Error al guardar el curso.",
      );
    }
  };

  if (error) {
    enqueueSnackbar(error, {
      variant: "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
    });
    setError(null);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle align="center">
        {isEditMode ? "Editar Curso" : "Crear Nuevo Curso"}
      </DialogTitle>
      <Divider variant="middle" />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 4, pt: 2 }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* --- SECCIÓN 1: Detalles Generales --- */}
              <Box>
                <Grid container spacing={3}>
                  {/* Columna Izquierda: Nombres y Descripción */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={2} sx={{ height: "100%" }}>
                      <TextField
                        {...register("nombre")}
                        label="Nombre del Curso"
                        fullWidth
                        required
                        disabled={isSubmitting || isTeacherMode}
                        error={!!errors.nombre}
                        helperText={errors.nombre?.message}
                      />
                      <TextField
                        {...register("descripcion")}
                        label="Descripción"
                        fullWidth
                        multiline
                        required
                        disabled={isSubmitting}
                        error={!!errors.descripcion}
                        helperText={errors.descripcion?.message}
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          "& .MuiInputBase-root": {
                            flexGrow: 1,
                            alignItems: "flex-start",
                          },
                        }}
                      />
                    </Stack>
                  </Grid>

                  {/* Columna Derecha: Imagen */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl fullWidth error={!!errors.imagen}>
                      <Box
                        sx={{
                          border: "2px dashed",
                          borderColor: errors.imagen
                            ? "error.main"
                            : "grey.400",
                          borderRadius: 2,
                          p: 2,
                          textAlign: "center",
                          height: 195,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "grey.50",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "primary.50",
                          },
                        }}
                      >
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Previsualización"
                            style={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                              borderRadius: "4px",
                            }}
                          />
                        ) : (
                          <>
                            <CloudUploadIcon
                              color="action"
                              sx={{ fontSize: 40, mb: 1, opacity: 0.7 }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight="medium"
                            >
                              Subir Imagen Portada
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              JPG, PNG, GIF (Máx. 2MB)
                            </Typography>
                          </>
                        )}
                      </Box>
                      <Button
                        component="label"
                        variant="outlined"
                        sx={{ mt: 1.5 }}
                        disabled={isSubmitting}
                      >
                        {previewImage
                          ? "Cambiar Archivo"
                          : "Seleccionar Archivo"}
                        <VisuallyHiddenInput
                          type="file"
                          {...register("imagen")}
                          onChange={handleFileChange}
                          inputProps={{ accept: ".jpg,.jpeg,.png,.gif" }}
                        />
                      </Button>
                      {errors.imagen && (
                        <FormHelperText error sx={{ textAlign: "center" }}>
                          {errors.imagen.message as string}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* --- SECCIÓN 2: Configuración de Acceso --- */}
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      {...register("contrasenaAcceso")}
                      label="Contraseña de Acceso"
                      fullWidth
                      required
                      disabled={isSubmitting}
                      type={showPassword ? "text" : "password"}
                      error={!!errors.contrasenaAcceso}
                      helperText={errors.contrasenaAcceso?.message}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="modalidadPreferencial"
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          error={!!errors.modalidadPreferencial}
                        >
                          <InputLabel>Modalidad preferencial</InputLabel>
                          <Select
                            {...field}
                            label="Modalidad preferencial"
                            disabled={isSubmitting}
                          >
                            <MenuItem value={modalidad.Presencial}>
                              Presencial
                            </MenuItem>
                            <MenuItem value={modalidad.Virtual}>
                              Virtual
                            </MenuItem>
                          </Select>
                          <FormHelperText>
                            {errors.modalidadPreferencial?.message ||
                              "Para clases de consulta automáticas"}
                          </FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="docentes"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <>
                          <FormControl
                            fullWidth
                            error={!!errors.docentes}
                            disabled={isTeacherMode || docentesLoading}
                          >
                            <InputLabel shrink>Docentes a asignar</InputLabel>
                            <OutlinedInput
                              notched
                              label="Docentes a asignar"
                              readOnly
                              value={
                                value && value.length > 0
                                  ? value
                                      .map((docente: any) => docente.nombre)
                                      .join(", ")
                                  : ""
                              }
                              placeholder={
                                docentesLoading
                                  ? "Cargando..."
                                  : "Sin asignar..."
                              }
                              inputProps={{
                                sx: {
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                },
                              }}
                              endAdornment={
                                <InputAdornment position="end">
                                  <Button
                                    size="small"
                                    onClick={() => setIsTeacherModalOpen(true)}
                                    startIcon={<PersonSearch />}
                                    disabled={isTeacherMode || docentesLoading}
                                  >
                                    Seleccionar
                                  </Button>
                                </InputAdornment>
                              }
                            />
                            {errors.docentes && (
                              <FormHelperText>
                                {errors.docentes.message}
                              </FormHelperText>
                            )}
                          </FormControl>

                          <SelectTeacherModal
                            open={isTeacherModalOpen}
                            onClose={() => setIsTeacherModalOpen(false)}
                            allDocentes={allDocentes}
                            initialSelection={value || []}
                            onSelect={onChange}
                          />
                        </>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* --- SECCIÓN 3: Horarios de Cursada --- */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() =>
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
                    Añadir Día
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {diasClaseFields.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{
                        py: 2,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        border: "1px dashed grey",
                      }}
                    >
                      No hay días de clase configurados. Haz clic en "Añadir
                      Día" para comenzar.
                    </Typography>
                  )}

                  {diasClaseFields.map((field, index) => (
                    <Paper
                      key={field.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 2,
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems="center"
                      >
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
                          label="Hora Inicio"
                          type="time"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ flex: 1 }}
                          error={!!errors.diasClase?.[index]?.horaInicio}
                        />
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                        <TextField
                          {...register(`diasClase.${index}.horaFin`)}
                          label="Hora Fin"
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
                        <Tooltip title="Eliminar horario">
                          <IconButton
                            onClick={() => removeDiaClase(index)}
                            color="error"
                            sx={{ ml: { sm: "auto" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  ))}
                  {errors.diasClase &&
                    typeof errors.diasClase.message === "string" && (
                      <FormHelperText error sx={{ ml: 1 }}>
                        {errors.diasClase.message}
                      </FormHelperText>
                    )}
                </Stack>
              </Box>
            </>
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
      </Box>
    </Dialog>
  );
}
