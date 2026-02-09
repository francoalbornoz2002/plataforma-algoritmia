import { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
} from "@mui/material";
// Componentes MUI X
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
// Utilidades de fecha
import { format, addDays } from "date-fns";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enqueueSnackbar } from "notistack";

import type { ClaseConsulta } from "../../../types";
import apiClient from "../../../lib/axios";
import { timeToDate } from "../../../utils/dateHelpers";

// --- Helpers Locales ---
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const createTime = (hours: number, minutes: number) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// --- Esquema de Validación (Réplica de clase-consulta.schema.ts) ---
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schema = z
  .object({
    fechaClase: z.string().min(1, "La fecha es obligatoria"),
    horaInicio: z.string().regex(timeRegex, "Formato inválido"),
    horaFin: z.string().regex(timeRegex, "Formato inválido"),
  })
  .refine((data) => data.horaFin > data.horaInicio, {
    message: "La hora de fin debe ser mayor a la de inicio",
    path: ["horaFin"],
  })
  .refine((data) => data.horaInicio >= "08:00" && data.horaFin <= "21:00", {
    message: "El horario debe estar entre las 08:00 y las 21:00 hs",
    path: ["horaFin"],
  })
  .refine(
    (data) => {
      const [startH, startM] = data.horaInicio.split(":").map(Number);
      const [endH, endM] = data.horaFin.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes - startMinutes <= 4 * 60;
    },
    {
      message: "La duración máxima es de 4 horas",
      path: ["horaFin"],
    },
  );

type FormValues = z.infer<typeof schema>;

interface AceptarManualModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clase: ClaseConsulta | null;
}

export default function AceptarManualModal({
  open,
  onClose,
  onSuccess,
  clase,
}: AceptarManualModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fechaClase: "",
      horaInicio: "",
      horaFin: "",
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (clase && open) {
      const fechaObj = new Date(clase.fechaInicio);
      const finObj = new Date(clase.fechaFin);

      reset({
        fechaClase: format(fechaObj, "yyyy-MM-dd"),
        horaInicio: format(fechaObj, "HH:mm"),
        horaFin: format(finObj, "HH:mm"),
      });
    }
  }, [clase, open, reset]);

  // --- Lógica de Límites para TimePickers (Igual que en ClaseConsultaFormModal) ---
  const horaInicioValue = watch("horaInicio");
  const minStartTime = createTime(8, 0);
  const maxStartTime = createTime(20, 30);

  const { minEndTime, maxEndTime } = useMemo(() => {
    if (!horaInicioValue)
      return { minEndTime: undefined, maxEndTime: undefined };
    const [h, m] = horaInicioValue.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    const min = new Date(start.getTime() + 30 * 60000); // +30 min
    const maxCalc = new Date(start.getTime() + 4 * 60 * 60000); // +4 hs
    const absoluteMax = createTime(21, 0);
    const max = maxCalc > absoluteMax ? absoluteMax : maxCalc;
    return { minEndTime: min, maxEndTime: max };
  }, [horaInicioValue]);

  // --- Submit ---
  const onSubmit = async (data: FormValues) => {
    if (!clase) return;
    try {
      const [year, month, day] = data.fechaClase.split("-").map(Number);
      const [startH, startM] = data.horaInicio.split(":").map(Number);
      const [endH, endM] = data.horaFin.split(":").map(Number);

      const fechaInicio = new Date(year, month - 1, day, startH, startM);
      const fechaFin = new Date(year, month - 1, day, endH, endM);

      const payload = {
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      };

      await apiClient.patch(
        `/clases-consulta/${clase.id}/aceptar-reprogramar`,
        payload,
      );

      onSuccess();
      onClose();
      enqueueSnackbar("¡Clase aceptada y reprogramada con éxito!", {
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(
        err.response?.data?.message || "Error al procesar la solicitud.",
        { variant: "error" },
      );
    }
  };

  // Límites de fecha (Hoy hasta +7 días)
  const minDate = new Date();
  const maxDate = addDays(new Date(), 7);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Aceptar y Reprogramar</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Define el nuevo horario para confirmar la clase.
            </Typography>

            <Controller
              name="fechaClase"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Nueva Fecha"
                  value={field.value ? parseLocalDate(field.value) : null}
                  onChange={(newValue) =>
                    field.onChange(
                      newValue ? format(newValue, "yyyy-MM-dd") : "",
                    )
                  }
                  minDate={minDate}
                  maxDate={maxDate}
                  disablePast
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.fechaClase,
                      helperText: errors.fechaClase?.message || " ",
                      InputProps: { readOnly: true },
                    },
                  }}
                />
              )}
            />

            <Stack direction="row" spacing={2}>
              <Controller
                name="horaInicio"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    label="Hora Inicio"
                    ampm={false}
                    minTime={minStartTime}
                    maxTime={maxStartTime}
                    value={field.value ? timeToDate(field.value) : null}
                    onChange={(newValue) =>
                      field.onChange(newValue ? format(newValue, "HH:mm") : "")
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.horaInicio,
                        helperText: errors.horaInicio?.message || " ",
                        InputProps: { readOnly: true },
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
                    label="Hora Fin"
                    ampm={false}
                    minTime={minEndTime}
                    maxTime={maxEndTime}
                    value={field.value ? timeToDate(field.value) : null}
                    onChange={(newValue) =>
                      field.onChange(newValue ? format(newValue, "HH:mm") : "")
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.horaFin,
                        helperText: errors.horaFin?.message || " ",
                        InputProps: { readOnly: true },
                      },
                    }}
                  />
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Confirmando..." : "Confirmar Cambio"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
