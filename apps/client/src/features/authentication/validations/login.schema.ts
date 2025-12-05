import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Debe ingresar un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  remember: z.boolean(),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;
