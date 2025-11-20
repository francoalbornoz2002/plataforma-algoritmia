import { z } from "zod";
import { modalidad } from "../../../types";

// Regex para validar "HH:mm"
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createClaseConsultaSchema = z
  .object({
    idDocente: z.uuid("Debe ser un UUID de docente válido"),

    nombre: z.string().min(5, "El nombre debe tener al menos 5 caracteres"),

    descripcion: z
      .string()
      .min(5, "La descripción debe tener al menos 10 caracteres"),

    // Usamos z.string() y refinamos, porque el DatePicker de MUI
    // a veces devuelve un objeto Date, y 'nativeEnum' falla.
    // Es más simple validar el string final.
    fechaClase: z.string().min(1, "La fecha es obligatoria"),

    horaInicio: z
      .string()
      .regex(timeRegex, "Formato inválido (debe ser HH:mm)"),

    horaFin: z.string().regex(timeRegex, "Formato inválido (debe ser HH:mm)"),

    modalidad: z.enum(modalidad, "Debe seleccionar una modalidad"),

    consultasIds: z
      .array(z.uuid())
      .min(5, "Debe seleccionar al menos 5 consultas"),
  })
  // Refine 1: Inicio < Fin
  .refine((data) => data.horaFin > data.horaInicio, {
    message: "La hora de fin debe ser mayor a la de inicio",
    path: ["horaFin"],
  })
  // --- Refine 2: Fin <= 23:00 ---
  .refine(
    (data) => {
      // "23:01" > "23:00" es true. Queremos que sea falso si pasa de las 23:00.
      return data.horaFin <= "23:00";
    },
    {
      message: "La clase no puede terminar después de las 23:00 hs",
      path: ["horaFin"],
    }
  );

export type CreateClaseConsultaFormValues = z.infer<
  typeof createClaseConsultaSchema
>;

// --- DTO de Update (Parcial) ---
export const updateClaseConsultaSchema = createClaseConsultaSchema.partial();

export type UpdateClaseConsultaFormValues = z.infer<
  typeof updateClaseConsultaSchema
>;
