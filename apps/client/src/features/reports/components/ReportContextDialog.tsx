import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SchoolIcon from "@mui/icons-material/School";
import { findCourses } from "../../courses/services/courses.service";
import type { CursoConDetalles } from "../../../types";

interface ReportContextDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectGeneral: () => void;
  onSelectCourse: (course: { id: string; nombre: string }) => void;
}

export default function ReportContextDialog({
  open,
  onClose,
  onSelectGeneral,
  onSelectCourse,
}: ReportContextDialogProps) {
  const [step, setStep] = useState<"type" | "course">("type");
  const [courses, setCourses] = useState<CursoConDetalles[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CursoConDetalles | null>(
    null,
  );

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      setStep("type");
      setSelectedCourse(null);
    }
  }, [open]);

  // Cargar cursos si se selecciona la opción de curso
  useEffect(() => {
    if (step === "course" && courses.length === 0) {
      setLoadingCourses(true);
      findCourses({ page: 1, limit: 100, sort: "nombre", order: "asc" })
        .then((res) => setCourses(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingCourses(false));
    }
  }, [step, courses.length]);

  const handleCourseConfirm = () => {
    if (selectedCourse) {
      onSelectCourse({ id: selectedCourse.id, nombre: selectedCourse.nombre });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        {step === "type"
          ? "Selecciona el tipo de reporte"
          : "Selecciona un curso"}
      </DialogTitle>
      <DialogContent>
        {step === "type" ? (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  onSelectGeneral();
                  onClose();
                }}
              >
                <AssessmentIcon
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h6">Reportes Generales</Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuarios, Totales de Cursos, Auditoría
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setStep("course")}
              >
                <SchoolIcon
                  sx={{ fontSize: 48, color: "secondary.main", mb: 1 }}
                />
                <Typography variant="h6">Reportes por Curso</Typography>
                <Typography variant="body2" color="text.secondary">
                  Progreso, Dificultades, Consultas, Sesiones
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ mt: 2, minHeight: 200 }}>
            <Typography variant="body1" gutterBottom>
              Elige el curso del cual deseas ver los reportes detallados:
            </Typography>
            <Autocomplete
              options={courses}
              loading={loadingCourses}
              getOptionLabel={(option) => option.nombre}
              value={selectedCourse}
              onChange={(_, newValue) => setSelectedCourse(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar curso"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCourses ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {step === "course" && (
          <>
            <Button onClick={() => setStep("type")}>Volver</Button>
            <Button
              variant="contained"
              onClick={handleCourseConfirm}
              disabled={!selectedCourse}
            >
              Ver Reportes
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
