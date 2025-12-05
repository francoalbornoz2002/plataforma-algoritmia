import { z } from "zod";

export const institutionSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  direccion: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres."),
  email: z.string().email("El formato del email no es válido."),

  telefono: z
    .string()
    .min(1, "El teléfono es requerido.")
    .refine(
      (val) => {
        // 1. Contar dígitos reales, ignorando símbolos.
        const digitCount = (val.match(/\d/g) || []).length;
        if (digitCount < 7) {
          return false; // No tiene suficientes dígitos.
        }

        // 2. El '+' solo puede estar al inicio.
        if (val.indexOf("+") > 0) {
          return false;
        }

        // 3. No puede empezar o terminar con '-'.
        if (val.startsWith("-") || val.endsWith("-")) {
          return false;
        }

        // 4. No puede tener guiones consecutivos '--'.
        if (val.includes("--")) {
          return false;
        }

        return true; // Si pasa todas las validaciones.
      },
      {
        message:
          "Formato no válido. Debe tener al menos 7 dígitos y usar solo números, '+' o '-'.",
      }
    ),

  idProvincia: z.number().min(1, "Debe seleccionar una provincia."),
  idLocalidad: z.number().min(1, "Debe seleccionar una localidad."),
});

export type InstitutionFormValues = z.infer<typeof institutionSchema>;
