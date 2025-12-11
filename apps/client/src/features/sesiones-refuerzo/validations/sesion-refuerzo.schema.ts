import { z } from "zod";
import { grado_dificultad } from "../../../types";

export const sesionRefuerzoSchema = z.object({
  idAlumno: z.string("Debes seleccionar un alumno."),
  idDificultad: z.string("Debes seleccionar una dificultad."),
  gradoSesion: z.enum(grado_dificultad, "Grado de sesión no válido."),
  fechaHoraLimite: z
    .date("La fecha y hora límite es requerida.")
    .min(new Date(), { message: "La fecha no puede ser en el pasado." }),
  tiempoLimite: z
    .number("El tiempo límite es requerido.")
    .int()
    .positive({ message: "El tiempo límite debe ser mayor a 0." }),
  preguntas: z
    .array(z.string())
    .min(1, "La sesión debe tener al menos una pregunta."),
});

export type SesionRefuerzoFormValues = z.infer<typeof sesionRefuerzoSchema>;
