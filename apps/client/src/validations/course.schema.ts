import { z } from "zod";
import { dias_semana, modalidad } from "../types";

// Esquema para un dia de clase
const diaClaseSchema = z.object({
  id: z.string().nullable(),
  dia: z.enum(dias_semana, "Debe seleccionar un día"),
  horaInicio: z.string().min(1, "Requerido"),
  horaFin: z.string().min(1, "Requerido"),
  modalidad: z.enum(modalidad, "Requerido"),
});

// Esquema para un docente (lo que usa el Autocomplete)
const docenteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
});

// --- Esquema Principal del Formulario ---
export const courseFormSchema = z.object({
  nombre: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(255),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(255),
  contrasenaAcceso: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  modalidadPreferencial: z.enum(modalidad, "Debe seleccionar una modalidad"),

  // Validar el array de objetos de docentes
  docentes: z.array(docenteSchema).min(1, "Debe asignar al menos un docente"),

  // Validar el array de objetos de días de clase
  diasClase: z
    .array(diaClaseSchema)
    .min(1, "Debe definir al menos un día de clase"),

  // Validación de imagen (opcional)
  // `any()` permite FileList, File, o null/undefined
  imagen: z.any().optional(),
});

// Extraemos el tipo de TS a partir del esquema
export type CourseFormValues = z.infer<typeof courseFormSchema>;
