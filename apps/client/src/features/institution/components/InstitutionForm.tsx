import { useEffect, useState } from "react";
import {
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  FormHelperText,
  Box,
  Stack,
  Typography,
  Divider,
  styled,
} from "@mui/material";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "notistack";

import {
  upsertInstitucion,
  getProvincias,
  getLocalidadesByProvincia,
} from "../services/institution.service";
import {
  institutionSchema,
  type InstitutionFormValues,
} from "../validations/institution.schema";
import type { Provincia, Localidad, Institucion } from "../../../types";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";

interface InstitutionFormProps {
  initialData: Institucion | null;
  onSave: (newData: Institucion) => void;
}

const VisuallyHiddenInput = styled("input")({
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

const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

export default function InstitutionForm({
  initialData,
  onSave,
}: InstitutionFormProps) {
  const { enqueueSnackbar } = useSnackbar();

  // Estados para los Dropdowns
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);

  // Estados para el Logo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Estado de Error
  const [error, setError] = useState<string | null>(null);

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      email: "",
      telefono: "",
      idProvincia: 0,
      idLocalidad: 0,
    },
  });

  const watchedProvinciaId = watch("idProvincia");

  // --- EFECTO DE CARGA INICIAL (Ahora depende de 'initialData') ---
  useEffect(() => {
    // 1. Cargar las provincias (siempre)
    getProvincias().then(setProvincias);

    // 2. Si tenemos datos (Modo Edición/Vista)
    if (initialData) {
      const initialProvinciaId = initialData.localidad.idProvincia;

      // 3. Cargar las localidades de esa provincia
      getLocalidadesByProvincia(initialProvinciaId).then(setLocalidades);

      // 4. Resetear el formulario con los datos cargados
      reset({
        nombre: initialData.nombre,
        direccion: initialData.direccion,
        email: initialData.email,
        telefono: initialData.telefono,
        idProvincia: initialProvinciaId,
        idLocalidad: initialData.idLocalidad,
      });

      if (initialData.logoUrl) {
        setPreviewImage(`${baseUrl}${initialData.logoUrl}`);
      }
    } else {
      // Modo Creación: Reseteamos a los 'defaultValues' del useForm
      reset({
        nombre: "",
        direccion: "",
        email: "",
        telefono: "",
        idProvincia: 0,
        idLocalidad: 0,
      });
      setSelectedFile(null);
      setPreviewImage(null);
    }
  }, [initialData, reset]); // Se ejecuta si 'initialData' cambia

  // --- EFECTO DE CASCADA (Dropdowns Anidados) ---
  useEffect(() => {
    if (!watchedProvinciaId) {
      setLocalidades([]);
      return;
    }

    // No corremos esto si 'watchedProvinciaId' es el mismo que el inicial
    if (watchedProvinciaId === initialData?.localidad?.idProvincia) {
      return;
    }

    const loadLocalidades = async () => {
      try {
        const localidadesData =
          await getLocalidadesByProvincia(watchedProvinciaId);
        setLocalidades(localidadesData);
        setValue("idLocalidad", 0); // Resetear localidad
      } catch (err: any) {
        console.error(err);
        setLocalidades([]);
      }
    };

    loadLocalidades();
  }, [watchedProvinciaId, setValue, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // --- HANDLER DE SUBMIT ---
  const onSubmit: SubmitHandler<InstitutionFormValues> = async (data) => {
    setError(null);
    try {
      const newData = await upsertInstitucion(data, selectedFile);
      onSave(newData); // Llama al callback del padre
      enqueueSnackbar("Datos de la institución guardados con éxito", {
        variant: "success",
      });
    } catch (err: any) {
      setError(err.message || "Error al guardar los datos.");
      enqueueSnackbar("Error: " + err.message, { variant: "error" });
    }
  };

  return (
    <Box>
      <Paper elevation={5} sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Registrar datos de la Institución
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* --- Sección de Logo --- */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                border: "1px dashed grey",
                borderRadius: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                mb: 1,
                bgcolor: "#f5f5f5",
              }}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Logo Preview"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Sin Logo
                </Typography>
              )}
            </Box>
            <Button component="label" startIcon={<CloudUploadIcon />}>
              Subir Logo
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileChange}
                accept="image/*"
              />
            </Button>
          </Box>

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Stack spacing={1.5} direction="row">
              {/* --- 1. Provincia --- */}
              <FormControl fullWidth error={!!errors.idProvincia}>
                <InputLabel>Provincia</InputLabel>
                <Controller
                  name="idProvincia"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Provincia"
                      disabled={isSubmitting}
                    >
                      <MenuItem value={0} disabled>
                        Seleccione una provincia...
                      </MenuItem>
                      {provincias.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.provincia}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText sx={{ minHeight: "1.25em" }}>
                  {(errors.idProvincia?.message as string) || " "}
                </FormHelperText>
              </FormControl>

              {/* --- 2. Localidad --- */}
              <FormControl fullWidth error={!!errors.idLocalidad}>
                <InputLabel>Localidad</InputLabel>
                <Controller
                  name="idLocalidad"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Localidad"
                      disabled={
                        !watchedProvinciaId ||
                        isSubmitting ||
                        localidades.length === 0
                      }
                    >
                      <MenuItem value={0} disabled>
                        Seleccione una localidad...
                      </MenuItem>
                      {localidades.map((l) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.localidad}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText sx={{ minHeight: "1.25em" }}>
                  {(errors.idLocalidad?.message as string) || " "}
                </FormHelperText>
              </FormControl>
            </Stack>

            <Stack spacing={1.5} direction="row">
              {/* --- 3. Nombre --- */}
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de la Institución"
                    fullWidth
                    required
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message || " "}
                    slotProps={{
                      formHelperText: {
                        style: { minHeight: "1.25em" },
                      },
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />

              {/* --- 4. Dirección --- */}
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dirección"
                    fullWidth
                    required
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message || " "}
                    slotProps={{
                      formHelperText: {
                        style: { minHeight: "1.25em" },
                      },
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Stack>

            <Stack spacing={1.5} direction="row">
              {/* --- 5. Email --- */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email de Contacto"
                    type="email"
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message || " "}
                    slotProps={{
                      formHelperText: {
                        style: { minHeight: "1.25em" },
                      },
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />

              {/* --- 6. Teléfono --- */}
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Teléfono de Contacto"
                    fullWidth
                    required
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message || " "}
                    inputMode="tel" // Mejora la experiencia en móviles
                    onChange={(e) => {
                      // Filtra la entrada para permitir solo números y los símbolos + y -
                      const filteredValue = e.target.value.replace(
                        /[^0-9+\-]/g,
                        "",
                      );
                      field.onChange(filteredValue);
                    }}
                    slotProps={{
                      formHelperText: {
                        style: { minHeight: "1.25em" },
                      },
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Stack>
          </Stack>

          {/* --- Botón y Error --- */}
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
