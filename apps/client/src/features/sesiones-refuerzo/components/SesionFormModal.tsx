import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  sesionRefuerzoSchema,
  type SesionRefuerzoFormValues,
} from "../validations/sesion-refuerzo.schema";
import { useCourseContext } from "../../../context/CourseContext";
import type {
  DocenteBasico,
  DificultadAlumnoDetallada,
  PreguntaConDetalles,
  SesionRefuerzoResumen,
} from "../../../types";
import {
  findEligibleAlumnos,
  getStudentDifficulties,
} from "../../users/services/alumnos.service";
import { findSystemPreguntasForSesion } from "../../preguntas/service/preguntas.service";
import AddExtraPreguntaModal from "./AddExtraPreguntaModal";
import {
  createSesion,
  updateSesion,
} from "../service/sesiones-refuerzo.service";

interface SesionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  sesionToEdit: SesionRefuerzoResumen | null;
}

export default function SesionFormModal({
  open,
  onClose,
  onSave,
  sesionToEdit,
}: SesionFormModalProps) {
  const { selectedCourse } = useCourseContext();
  const isEditMode = !!sesionToEdit;

  // --- Form State ---
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SesionRefuerzoFormValues>({
    resolver: zodResolver(sesionRefuerzoSchema),
  });

  // --- Data for Selects ---
  const [eligibleAlumnos, setEligibleAlumnos] = useState<DocenteBasico[]>([]);
  const [alumnoDificultades, setAlumnoDificultades] = useState<
    DificultadAlumnoDetallada[]
  >([]);

  // --- Questions State ---
  const [systemPreguntas, setSystemPreguntas] = useState<PreguntaConDetalles[]>(
    []
  );
  const [extraPreguntas, setExtraPreguntas] = useState<PreguntaConDetalles[]>(
    []
  );
  const [isExtraPreguntaModalOpen, setIsExtraPreguntaModalOpen] =
    useState(false);

  // --- Loading States ---
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [loadingDificultades, setLoadingDificultades] = useState(false);
  const [loadingSystemPreguntas, setLoadingSystemPreguntas] = useState(false);

  // --- Watch form fields to trigger effects ---
  const selectedAlumnoId = watch("idAlumno");
  const selectedDificultadId = watch("idDificultad");

  // Effect 1: Load eligible alumnos when modal opens
  useEffect(() => {
    if (open && selectedCourse) {
      setLoadingAlumnos(true);
      findEligibleAlumnos(selectedCourse.id)
        .then(setEligibleAlumnos)
        .catch(() =>
          enqueueSnackbar("Error al cargar alumnos.", { variant: "error" })
        )
        .finally(() => setLoadingAlumnos(false));
    }
  }, [open, selectedCourse]);

  // Effect 2: Load student's difficulties when an alumno is selected
  useEffect(() => {
    if (selectedAlumnoId && selectedCourse) {
      setLoadingDificultades(true);
      // Reset subsequent fields
      setValue("idDificultad", "" as any);
      setAlumnoDificultades([]);
      setSystemPreguntas([]);

      getStudentDifficulties(selectedCourse.id, selectedAlumnoId)
        .then(setAlumnoDificultades)
        .catch(() =>
          enqueueSnackbar("Error al cargar dificultades del alumno.", {
            variant: "error",
          })
        )
        .finally(() => setLoadingDificultades(false));
    }
  }, [selectedAlumnoId, selectedCourse, setValue]);

  // Effect 3: Set grado and load system preguntas when a dificultad is selected
  useEffect(() => {
    if (selectedDificultadId) {
      const dificultad = alumnoDificultades.find(
        (d) => d.id === selectedDificultadId
      );
      if (dificultad) {
        setValue("gradoSesion", dificultad.grado);
        setLoadingSystemPreguntas(true);
        findSystemPreguntasForSesion({
          idDificultad: selectedDificultadId,
          gradoDificultad: dificultad.grado,
        })
          .then(setSystemPreguntas)
          .catch(() =>
            enqueueSnackbar("Error al cargar preguntas de sistema.", {
              variant: "error",
            })
          )
          .finally(() => setLoadingSystemPreguntas(false));
      }
    }
  }, [selectedDificultadId, alumnoDificultades, setValue]);

  // Effect 4: Combine question IDs for form state
  useEffect(() => {
    const systemIds = systemPreguntas.map((p) => p.id);
    const extraIds = extraPreguntas.map((p) => p.id);
    setValue("preguntas", [...systemIds, ...extraIds]);
  }, [systemPreguntas, extraPreguntas, setValue]);

  // Effect 5: Reset form on close
  useEffect(() => {
    if (!open) {
      reset();
      setEligibleAlumnos([]);
      setAlumnoDificultades([]);
      setSystemPreguntas([]);
      setExtraPreguntas([]);
    }
  }, [open, reset]);

  const onSubmit = async (data: SesionRefuerzoFormValues) => {
    if (!selectedCourse) return;
    try {
      if (isEditMode) {
        await updateSesion(selectedCourse.id, sesionToEdit.id, data);
      } else {
        await createSesion(selectedCourse.id, data);
      }
      enqueueSnackbar(
        `Sesión ${isEditMode ? "actualizada" : "creada"} correctamente.`,
        { variant: "success" }
      );
      onSave();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || "Error al guardar la sesión.", {
        variant: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {isEditMode ? "Editar" : "Crear"} Sesión de Refuerzo
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Alumno, Dificultad, Grado */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={!!errors.idAlumno}>
                  <InputLabel>Alumno</InputLabel>
                  <Controller
                    name="idAlumno"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Alumno"
                        disabled={loadingAlumnos || isEditMode}
                      >
                        {eligibleAlumnos.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.nombre} {a.apellido}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.idAlumno?.message}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth error={!!errors.idDificultad}>
                  <InputLabel>Dificultad</InputLabel>
                  <Controller
                    name="idDificultad"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Dificultad"
                        disabled={!selectedAlumnoId || loadingDificultades}
                      >
                        {alumnoDificultades.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.idDificultad?.message}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Grado"
                  value={watch("gradoSesion") || ""}
                  fullWidth
                  disabled
                />
              </Grid>

              {/* Fecha y Tiempo Límite */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="fechaHoraLimite"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      {...field}
                      label="Fecha y Hora Límite"
                      sx={{ width: "100%" }}
                      slotProps={{
                        textField: {
                          error: !!errors.fechaHoraLimite,
                          helperText: errors.fechaHoraLimite?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tiempoLimite"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tiempo Límite (minutos)"
                      type="number"
                      fullWidth
                      error={!!errors.tiempoLimite}
                      helperText={errors.tiempoLimite?.message}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  )}
                />
              </Grid>

              {/* Lista de Preguntas */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Preguntas de la Sesión
                </Typography>
                {loadingSystemPreguntas ? (
                  <CircularProgress size={24} />
                ) : systemPreguntas.length === 0 &&
                  extraPreguntas.length === 0 &&
                  !selectedDificultadId ? (
                  <Alert severity="info" variant="outlined">
                    Selecciona una dificultad para cargar las preguntas.
                  </Alert>
                ) : (
                  <List dense>
                    {systemPreguntas.map((p) => (
                      <ListItem key={p.id}>
                        <ListItemText
                          primary={p.enunciado}
                          secondary="Pregunta de Sistema"
                        />
                      </ListItem>
                    ))}
                    {extraPreguntas.map((p) => (
                      <ListItem
                        key={p.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() =>
                              setExtraPreguntas((prev) =>
                                prev.filter((ep) => ep.id !== p.id)
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={p.enunciado}
                          secondary="Pregunta Extra"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => setIsExtraPreguntaModalOpen(true)}
                  disabled={extraPreguntas.length >= 3}
                >
                  Añadir Pregunta Extra ({extraPreguntas.length}/3)
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : "Guardar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <AddExtraPreguntaModal
        open={isExtraPreguntaModalOpen}
        onClose={() => setIsExtraPreguntaModalOpen(false)}
        onConfirm={setExtraPreguntas}
        limit={3}
        initialSelection={extraPreguntas}
      />
    </>
  );
}
