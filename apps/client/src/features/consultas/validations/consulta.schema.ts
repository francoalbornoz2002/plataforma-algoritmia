import { z } from "zod";
import { temas } from "../../../types"; // Ajusta la ruta a 'types'

export const createConsultaSchema = z.object({
  titulo: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  tema: z.enum(temas, "Debe elegir un tema"),
});

export const updateConsultaSchema = createConsultaSchema.partial();

export type CreateConsultaFormValues = z.infer<typeof createConsultaSchema>;
export type UpdateConsultaFormValues = z.infer<typeof updateConsultaSchema>;
