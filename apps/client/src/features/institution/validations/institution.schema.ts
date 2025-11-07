import { z } from "zod";

export const institutionSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido"),
  direccion: z.string().min(5, "La dirección es requerido"),
  email: z.email("Debe ser un email válido"),
  telefono: z.string().min(7, "El teléfono es requerido"),

  // Usamos 'any()' y lo refinamos porque RHF + MUI Select
  // a veces envían 'string' y a veces 'number'.
  idProvincia: z
    .any()
    .refine((val) => val !== 0 && val !== "", "Debe seleccionar una provincia"),

  idLocalidad: z
    .any()
    .refine((val) => val !== 0 && val !== "", "Debe seleccionar una localidad"),
});

export type InstitutionFormValues = z.infer<typeof institutionSchema>;
