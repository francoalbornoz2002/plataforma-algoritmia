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
  type SelectChangeEvent, // Para el layout de diasClase
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
} from "../../../services/courses.service";
import {
  type CreateCourseData,
  type UpdateCourseData,
  type DiaClaseFormData,
  type DocenteParaFiltro,
  modalidad,
  dias_semana,
  type CursoParaEditar,
} from "../../../types";

interface CourseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // Para notificar a la página principal que debe recargar
  courseToEditId: string | null;
}

// Estado inicial para los campos simples
const initialFormState = {
  nombre: "",
  descripcion: "",
  contrasenaAcceso: "",
  modalidadPreferencial: modalidad.Presencial,
};

export default function CourseFormDialog({
  open,
  onClose,
  onSave,
  courseToEditId,
}: CourseFormDialogProps) {
  // --- ESTADOS ---
  const [formData, setFormData] = useState(initialFormState);
  const [selectedDocentes, setSelectedDocentes] = useState<DocenteParaFiltro[]>(
    []
  );
  const [diasClase, setDiasClase] = useState<DiaClaseFormData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Para previsualizar imagen

  // Estado para poblar el Autocomplete de docentes
  const [allDocentes, setAllDocentes] = useState<DocenteParaFiltro[]>([]);
  const [docentesLoading, setDocentesLoading] = useState(false);

  // Estados de carga y error
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Cargar datos en modo edición
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!courseToEditId;

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
          // 1. Usamos el servicio actualizado
          const course: CursoParaEditar = await findCourseById(courseToEditId);

          // 2. Poblamos los estados simples
          setFormData({
            nombre: course.nombre,
            descripcion: course.descripcion,
            contrasenaAcceso: course.contrasenaAcceso,
            modalidadPreferencial: course.modalidadPreferencial,
          });

          // 3. Poblamos los docentes (con la corrección de tipos)
          setSelectedDocentes(course.docentes);

          // 4. Poblamos los días de clase (con ID real y temporal)
          setDiasClase(
            course.diasClase.map((dia) => ({
              ...dia, // Esto incluye el ID real (ej: id: "db-uuid-123")
              _tempId: crypto.randomUUID(), // Y añadimos el ID temporal para React
            }))
          );

          // 5. Poblamos la imagen de previsualización
          if (course.imagenUrl) {
            setPreviewImage(course.imagenUrl);
          }
          setSelectedFile(null); // Reseteamos el archivo seleccionado
        } catch (err: any) {
          setError(err.message || "Error al cargar datos del curso.");
        } finally {
          setIsLoading(false);
        }
      } else {
        // Si abrimos en modo "Crear", reseteamos todos los estados
        setFormData(initialFormState);
        setSelectedDocentes([]);
        setDiasClase([]);
        setSelectedFile(null);
        setPreviewImage(null);
        setError(null);
      }
    };
    fetchCourseData();
  }, [courseToEditId, open, isEditMode]);

  // --- Handlers del Formulario Simple ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<modalidad>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Handlers de Días de Clase ---
  const addDiaClase = () => {
    setDiasClase([
      ...diasClase,
      {
        id: null, // Es nuevo, no tiene ID real
        _tempId: crypto.randomUUID(), // ID temporal para la key de React
        dia: dias_semana.Lunes,
        horaInicio: "09:00",
        horaFin: "11:00",
        modalidad: modalidad.Presencial,
      },
    ]);
  };

  const removeDiaClase = (tempId: string) => {
    setDiasClase(diasClase.filter((d) => d._tempId !== tempId));
  };

  const handleDiaClaseChange = (
    tempId: string,
    field: keyof Omit<DiaClaseFormData, "id" | "_tempId">,
    value: string
  ) => {
    setDiasClase(
      diasClase.map((dia) =>
        dia._tempId === tempId ? { ...dia, [field]: value } : dia
      )
    );
  };

  // --- Handlers de Archivo ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Crea una URL local para la previsualización
    }
  };

  // --- Handler de Submit ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // 1. Preparar datos
    const docenteIds = selectedDocentes.map((d) => d.id);
    const diasClaseLimpios = diasClase.map((d) => {
      const { _tempId, ...dia } = d; // Solo quitamos el _tempId
      return dia; // 'dia' ahora contiene { id: 'real-id' | null, ... }
    });

    try {
      if (isEditMode) {
        // Modo Edición
        const updateData: UpdateCourseData = {
          ...formData,
          docenteIds,
          diasClase: diasClaseLimpios,
        };
        await updateCourse(courseToEditId, updateData, selectedFile);
      } else {
        // Modo Creación
        const createData: CreateCourseData = {
          ...formData,
          docenteIds,
          diasClase: diasClaseLimpios,
        };
        await createCourse(createData, selectedFile);
      }
      onSave(); // Llama al handler de CoursesPage para refetchear y cerrar
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? "Editar Curso" : "Añadir Nuevo Curso"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            // --- Usamos Grid v2 (con 'size') ---
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* --- Columna Izquierda: Datos Principales --- */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={2}>
                  <TextField
                    name="nombre"
                    label="Nombre del Curso"
                    value={formData.nombre}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={isSaving}
                  />
                  <TextField
                    name="descripcion"
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    required
                    disabled={isSaving}
                  />
                  <TextField
                    name="contrasenaAcceso"
                    label="Contraseña de Acceso"
                    value={formData.contrasenaAcceso}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={isSaving}
                    type="password"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Modalidad (Consultas)</InputLabel>
                    <Select
                      name="modalidadPreferencial"
                      value={formData.modalidadPreferencial}
                      label="Modalidad (Consultas)"
                      onChange={handleSelectChange}
                      disabled={isSaving}
                    >
                      <MenuItem value={modalidad.Presencial}>
                        Presencial
                      </MenuItem>
                      <MenuItem value={modalidad.Virtual}>Virtual</MenuItem>
                    </Select>
                  </FormControl>
                  <Autocomplete
                    multiple
                    options={allDocentes}
                    loading={docentesLoading}
                    value={selectedDocentes}
                    onChange={(e, newValue) => setSelectedDocentes(newValue)}
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
                        label="Docentes Asignados"
                        placeholder="Buscar docente..."
                      />
                    )}
                  />
                </Stack>
              </Grid>

              {/* --- Columna Derecha: Imagen --- */}
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth>
                  <Typography variant="subtitle2" gutterBottom>
                    Imagen del Curso
                  </Typography>
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
                      position: "relative",
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
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sube una imagen
                      </Typography>
                    )}
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                    disabled={isSaving}
                  >
                    Seleccionar Archivo
                    <Input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                      inputProps={{
                        accept: "image/*",
                      }}
                    />
                  </Button>
                </FormControl>
              </Grid>

              {/* --- Fila Inferior: Días de Clase --- */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Días de Clase
                  </Typography>
                  <Stack spacing={2}>
                    {diasClase.map((dia) => (
                      <Stack
                        key={dia._tempId} // Usamos el ID temporal para la key de React
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems="center"
                      >
                        <FormControl
                          size="small"
                          sx={{ minWidth: 130, flex: 1.5 }}
                        >
                          <InputLabel>Día</InputLabel>
                          <Select
                            value={dia.dia}
                            label="Día"
                            onChange={(e) =>
                              handleDiaClaseChange(
                                dia._tempId!,
                                "dia",
                                e.target.value
                              )
                            }
                          >
                            {Object.values(dias_semana).map((d) => (
                              <MenuItem key={d} value={d}>
                                {d}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Inicio"
                          type="time"
                          size="small"
                          value={dia.horaInicio}
                          InputLabelProps={{ shrink: true }} // Para que no se superponga
                          onChange={(e) =>
                            handleDiaClaseChange(
                              dia._tempId!,
                              "horaInicio",
                              e.target.value
                            )
                          }
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Fin"
                          type="time"
                          size="small"
                          value={dia.horaFin}
                          InputLabelProps={{ shrink: true }} // Para que no se superponga
                          onChange={(e) =>
                            handleDiaClaseChange(
                              dia._tempId!,
                              "horaFin",
                              e.target.value
                            )
                          }
                          sx={{ flex: 1 }}
                        />
                        <FormControl
                          size="small"
                          sx={{ minWidth: 130, flex: 1 }}
                        >
                          <InputLabel>Modalidad</InputLabel>
                          <Select
                            value={dia.modalidad}
                            label="Modalidad"
                            onChange={(e) =>
                              handleDiaClaseChange(
                                dia._tempId!,
                                "modalidad",
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value={modalidad.Presencial}>
                              Presencial
                            </MenuItem>
                            <MenuItem value={modalidad.Virtual}>
                              Virtual
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => removeDiaClase(dia._tempId!)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button onClick={addDiaClase} disabled={isSaving}>
                      Añadir Día de Clase
                    </Button>
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
          <Button onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
