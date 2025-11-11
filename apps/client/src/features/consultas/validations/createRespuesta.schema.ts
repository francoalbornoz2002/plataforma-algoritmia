import { z } from "zod";

export const createRespuestaSchema = z.object({
  descripcion: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres"),
});

export type CreateRespuestaFormValues = z.infer<typeof createRespuestaSchema>;
