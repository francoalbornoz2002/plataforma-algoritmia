import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";
import { Badge, CalendarMonth, Event } from "@mui/icons-material";
import type { ProgresoAlumnoDetallado } from "../../../types";

interface InfoAlumnoProps {
  open: boolean;
  onClose: () => void;
  student: ProgresoAlumnoDetallado | any | null;
}

export default function InfoAlumno({
  open,
  onClose,
  student,
}: InfoAlumnoProps) {
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

  if (!student) return null;

  // Función para formatear fechas ignorando la zona horaria para nacimientos
  const formatBirthDate = (dateString?: string | Date | null) => {
    if (!dateString) return "No registrada";
    try {
      const dateObj =
        typeof dateString === "string" ? parseISO(dateString) : dateString;
      const day = dateObj.getUTCDate();
      const month = dateObj.getUTCMonth();
      const year = dateObj.getUTCFullYear();
      return format(new Date(year, month, day), "dd 'de' MMMM, yyyy", {
        locale: es,
      });
    } catch {
      return "Fecha inválida";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pb: 1, fontWeight: "bold" }}>
        Información del Alumno
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
            mt: 1,
          }}
        >
          <Avatar
            src={
              student.fotoPerfilUrl
                ? `${baseUrl}${student.fotoPerfilUrl}`
                : undefined
            }
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              fontSize: 32,
              border: 2,
              borderColor: "primary.main",
            }}
          >
            {student.apellido?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            {student.nombre} {student.apellido}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Badge color="action" />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                DNI
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {student.dni || "No registrado"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CalendarMonth color="action" />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Fecha de Nacimiento
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatBirthDate(student.fechaNacimiento)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Event color="action" />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Inscripción al curso
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {student.fechaInscripcion
                  ? format(
                      new Date(student.fechaInscripcion),
                      "dd/MM/yyyy - HH:mm",
                      { locale: es },
                    )
                  : "No registrada"}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          disableElevation
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
