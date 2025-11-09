import { z } from "zod";

export const valorarConsultaSchema = z.object({
  valoracion: z.number("Debe seleccionar una valoración").min(1).max(5),
  comentarioValoracion: z.string().optional(), // El comentario es opcional
});

export type ValorarConsultaFormValues = z.infer<typeof valorarConsultaSchema>;
