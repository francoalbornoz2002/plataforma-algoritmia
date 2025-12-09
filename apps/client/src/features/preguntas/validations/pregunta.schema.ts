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
    enunciado: z
      .string()
      .min(10, "El enunciado debe tener al menos 10 caracteres."),
    idDificultad: z.string().uuid("Debe seleccionar una dificultad válida."),
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
  .refine(
    (data) => {
      const textos = data.opcionesRespuesta.map((op) => op.textoOpcion);
      return new Set(textos).size === textos.length;
    },
    {
      message: "Las opciones de respuesta no pueden tener el mismo texto.",
      path: ["opcionesRespuesta"],
    }
  );

export type PreguntaFormValues = z.infer<typeof preguntaFormSchema>;
