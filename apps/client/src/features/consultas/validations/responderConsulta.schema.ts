import { z } from "zod";

export const responderConsultaSchema = z.object({
  descripcion: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres"),
});

export type ResponderConsultaFormValues = z.infer<
  typeof responderConsultaSchema
>;
