import { z } from "zod";
import type { Rol } from "../types/roles";

const rolValues: [Rol, ...Rol[]] = ["ADMIN", "DOCENTE", "ALUMNO"];
// const fechaLimite = new Date();

// Esquema base sin password
const userBaseSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  apellido: z.string().min(2, "El apellido es obligatorio"),
  dni: z.string().regex(/^\d{7,9}$/, "El DNI debe entre 7 y 9 dígitos"),
  fechaNacimiento: z
    .date("Formato de fecha inválido")
    .min(new Date(1930, 1, 1), { error: "Muy viejo!" }),
  //.max(
  //  fechaLimite.setFullYear(fechaLimite.getFullYear() - 18),
  //  "El usuario debe tener al menos 18 años."
  //)
  email: z
    .email("Formato de correo inválido")
    .min(1, "El email es obligatorio"),
  rol: z.enum(rolValues, "Debe ingresar un rol"),
});

// Esquema para CREAR (extiende el base y añade password)
export const createUserSchema = userBaseSchema.extend({
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder los 100 caracteres"), // Límite razonable
});

// Esquema para ACTUALIZAR (hace opcionales los campos base, password opcional con validación si se incluye)
export const updateUserSchema = userBaseSchema.partial().extend({
  // Password es opcional, pero si se envía, debe cumplir las reglas
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder los 100 caracteres")
    .optional()
    .or(z.literal("")), // Permite enviar string vacío para no cambiarla
});

// Tipos inferidos desde los esquemas Zod (¡muy útil!)
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
