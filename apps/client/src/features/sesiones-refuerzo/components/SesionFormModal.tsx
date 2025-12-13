import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  CircularProgress,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import {
  sesionRefuerzoSchema,
  type SesionRefuerzoFormValues,
} from "../validations/sesion-refuerzo.schema";
import { useCourseContext } from "../../../context/CourseContext";
import {
  type DocenteBasico,
  type DificultadAlumnoDetallada,
  type PreguntaConDetalles,
  type SesionRefuerzoResumen,
  grado_dificultad,
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
  findSesionById,
} from "../service/sesiones-refuerzo.service";
import PreguntaSesionAccordion from "./PreguntaSesionAccordion";

interface SesionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  sesionToEdit: SesionRefuerzoResumen | null;
}

// Define default values for the form, consistent with other forms.
const defaultValues: Omit<SesionRefuerzoFormValues, "fechaHoraLimite"> & {
  fechaHoraLimite: Date | null;
} = {
  idAlumno: "",
  idDificultad: "",
  gradoSesion: grado_dificultad.Ninguno,
  fechaHoraLimite: null, // Use null for a clean start in DateTimePicker
  tiempoLimite: 30,
  preguntas: [],
};
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
    defaultValues: defaultValues as SesionRefuerzoFormValues, // Set default values
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
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      // In create mode, changing the student should reset the difficulty.
      // In edit mode, this effect is just for populating the dropdown.
      if (!isEditMode) {
        setValue("idDificultad", "" as any);
        setSystemPreguntas([]);
      }
      setAlumnoDificultades([]);

      getStudentDifficulties(selectedCourse.id, selectedAlumnoId)
        .then((data) => {
          // Filtramos las dificultades que ya han sido superadas (Grado Ninguno)
          // ya que no se pueden generar sesiones para ellas.
          const filtered = data.filter(
            (d) => d.grado !== grado_dificultad.Ninguno
          );
          setAlumnoDificultades(filtered);
        })
        .catch(() =>
          enqueueSnackbar("Error al cargar dificultades del alumno.", {
            variant: "error",
          })
        )
        .finally(() => setLoadingDificultades(false));
    }
  }, [selectedAlumnoId, selectedCourse, setValue, isEditMode]);

  // Effect 3: Set grado and load system preguntas when a dificultad is selected
  useEffect(() => {
    // This should ONLY run in CREATE mode. In EDIT mode, questions are loaded from the session itself.
    if (selectedDificultadId && !isEditMode) {
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
  }, [selectedDificultadId, alumnoDificultades, setValue, isEditMode]);

  // Effect for populating the form in edit mode
  // or resetting for creation mode
  useEffect(() => {
    if (open) {
      if (isEditMode && sesionToEdit && selectedCourse) {
        setLoadingDetails(true);
        findSesionById(selectedCourse.id, sesionToEdit.id)
          .then((fullSesion) => {
            // 1. Populate form fields with data from the full session object
            reset({
              idAlumno: fullSesion.idAlumno,
              idDificultad: fullSesion.idDificultad,
              gradoSesion: fullSesion.gradoSesion,
              fechaHoraLimite: new Date(fullSesion.fechaHoraLimite),
              tiempoLimite: fullSesion.tiempoLimite,
              preguntas: fullSesion.preguntas.map((p) => p.pregunta.id),
            });

            // 2. Separate system and extra questions to display them in the list
            const systemQs = fullSesion.preguntas
              .filter((p) => p.pregunta.idDocente === null)
              .map((p) => p.pregunta);
            const extraQs = fullSesion.preguntas
              .filter((p) => p.pregunta.idDocente !== null)
              .map((p) => p.pregunta);

            setSystemPreguntas(systemQs);
            setExtraPreguntas(extraQs);
          })
          .catch(() => {
            enqueueSnackbar("Error al cargar los detalles de la sesión.", {
              variant: "error",
            });
            onClose();
          })
          .finally(() => setLoadingDetails(false));
      } else if (!isEditMode) {
        // Reset for creation mode
        reset(defaultValues as SesionRefuerzoFormValues);
        setSystemPreguntas([]);
        setExtraPreguntas([]);
        setAlumnoDificultades([]);
      }
    }
  }, [isEditMode, open, sesionToEdit, selectedCourse, reset, onClose]);

  // Effect 4: Combine question IDs for form state
  useEffect(() => {
    const systemIds = systemPreguntas.map((p) => p.id);
    const extraIds = extraPreguntas.map((p) => p.id);
    setValue("preguntas", [...systemIds, ...extraIds]);
  }, [systemPreguntas, extraPreguntas, setValue]);

  const onSubmit = async (data: SesionRefuerzoFormValues) => {
    if (!selectedCourse) return;
    try {
      if (isEditMode && sesionToEdit) {
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
      enqueueSnackbar(
        error.response?.data?.message ||
          error.message ||
          "Error al guardar la sesión.",
        {
          variant: "error",
        }
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          {isEditMode ? "Editar" : "Crear"} Sesión de Refuerzo
        </DialogTitle>
        <Divider variant="middle" />
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            {loadingDetails ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {/* --- Fila 1: Alumno, Dificultad, Grado --- */}
                <Stack direction="row" spacing={2}>
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
                          disabled={
                            !selectedAlumnoId ||
                            loadingDificultades ||
                            isEditMode
                          }
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
                  <TextField
                    fullWidth
                    label="Grado"
                    value={watch("gradoSesion") || ""}
                    disabled
                  />
                </Stack>
                {/* --- Fila 2: Fecha y Tiempo Límite --- */}
                <Stack direction="row" spacing={2}>
                  <Controller
                    name="fechaHoraLimite"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        label="Fecha y Hora Límite"
                        slotProps={{
                          textField: {
                            error: !!errors.fechaHoraLimite,
                            helperText: errors.fechaHoraLimite?.message,
                            fullWidth: true,
                          },
                        }}
                      />
                    )}
                  />
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
                </Stack>
                {/* --- Fila 3: Lista de Preguntas --- */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
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
                    <Stack spacing={1}>
                      {systemPreguntas.map((p) => (
                        <PreguntaSesionAccordion
                          key={p.id}
                          pregunta={p}
                          // No pasamos onRemove porque son de sistema
                        />
                      ))}
                      {extraPreguntas.map((p) => (
                        <PreguntaSesionAccordion
                          key={p.id}
                          pregunta={p}
                          onRemove={() =>
                            setExtraPreguntas((prev) =>
                              prev.filter((ep) => ep.id !== p.id)
                            )
                          }
                        />
                      ))}
                    </Stack>
                  )}
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setIsExtraPreguntaModalOpen(true)}
                    disabled={
                      extraPreguntas.length >= 3 || !selectedDificultadId
                    }
                  >
                    Añadir Pregunta Extra ({extraPreguntas.length}/3)
                  </Button>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : isEditMode ? (
                "Guardar Cambios"
              ) : (
                "Crear Sesión"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <AddExtraPreguntaModal
        open={isExtraPreguntaModalOpen}
        onClose={() => setIsExtraPreguntaModalOpen(false)}
        onConfirm={setExtraPreguntas}
        limit={3}
        initialSelection={extraPreguntas}
        idDificultadFiltro={selectedDificultadId}
        gradoSesionFiltro={watch("gradoSesion")}
      />
    </>
  );
}
