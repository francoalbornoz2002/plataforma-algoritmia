import { z } from "zod";
import { grado_dificultad } from "../../../types";

// Esquema para una única opción de respuesta dentro del formulario
const opcionRespuestaSchema = z.object({
  textoOpcion: z.string().min(1, "El texto de la opción no puede estar vacío."),
  esCorrecta: z.boolean(),
});

// Esquema principal para el formulario de creación/edición de preguntas
export const preguntaFormSchema = z
  .object({
    tema: z.string().min(1, "Debe seleccionar un tema."),
    enunciado: z
      .string()
      .min(10, "El enunciado debe tener al menos 10 caracteres."),
    idDificultad: z.string().min(1, "Debe seleccionar una dificultad"),
    gradoDificultad: z
      .nativeEnum(grado_dificultad)
      .refine((val) => val !== grado_dificultad.Ninguno, {
        message: "Debe seleccionar un grado de dificultad válido.",
      }),
    opcionesRespuesta: z
      .array(opcionRespuestaSchema)
      .min(2, "Debe haber entre 2 y 4 opciones de respuesta.")
      .max(4, "Debe haber entre 2 y 4 opciones de respuesta.")
      .refine(
        (opciones) =>
          opciones.filter((opcion) => opcion.esCorrecta).length === 1,
        { message: "Debe marcar exactamente una respuesta como correcta." }
      ),
  })
  .superRefine((data, ctx) => {
    // Lógica para detectar opciones de respuesta duplicadas.
    // Esta validación es más compleja para poder asignar el error
    // a cada campo individual que está duplicado, y no a todo el array.

    const textos = data.opcionesRespuesta.map((op) => op.textoOpcion.trim());

    // No validamos duplicados si hay campos vacíos, para que el error
    // de "campo requerido" tenga prioridad.
    if (textos.some((t) => t === "")) {
      return;
    }

    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const texto of textos) {
      if (seen.has(texto)) {
        duplicates.add(texto);
      } else {
        seen.add(texto);
      }
    }

    if (duplicates.size > 0) {
      data.opcionesRespuesta.forEach((opcion, index) => {
        if (duplicates.has(opcion.textoOpcion.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Esta opción de respuesta está duplicada.",
            path: [`opcionesRespuesta`, index, `textoOpcion`],
          });
        }
      });
    }
  });

export type PreguntaFormValues = z.infer<typeof preguntaFormSchema>;
