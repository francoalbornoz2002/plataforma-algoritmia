import { z } from "zod";
import { modalidad } from "../../../types";

// Regex para validar "HH:mm"
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 1. Definimos la forma base de los datos
const baseSchema = z.object({
  idDocente: z.string().uuid("Debe seleccionar un docente"), // Cambiado a string().uuid() para mayor claridad

  nombre: z
    .string()
    .min(1, "El nombre de la clase es obligatorio")
    .min(5, "El nombre debe tener al menos 5 caracteres"),

  descripcion: z
    .string()
    .min(1, "La descripción es obligatoria")
    .min(5, "La descripción debe tener al menos 10 caracteres"),

  fechaClase: z.string().min(1, "La fecha es obligatoria"),

  horaInicio: z
    .string()
    .min(1, "Hora de inicio es obligatoria")
    .regex(timeRegex, "Formato inválido (debe ser HH:mm)"),

  horaFin: z
    .string()
    .min(1, "Hora de fin es obligatoria")
    .regex(timeRegex, "Formato inválido (debe ser HH:mm)"),

  modalidad: z.nativeEnum(modalidad, "Debe seleccionar una modalidad"),

  consultasIds: z
    .array(z.string().uuid())
    .min(5, "Debe seleccionar al menos 5 consultas"),
});

// 2. Aplicamos los refinamientos al esquema base
// Esto asegura que las validaciones lógicas se ejecuten siempre
export const claseConsultaSchema = baseSchema
  // Refine 1: Inicio < Fin
  .refine((data) => data.horaFin > data.horaInicio, {
    message: "La hora de fin debe ser mayor a la de inicio",
    path: ["horaFin"],
  })
  // --- Refine 2: Rango Horario (08:00 - 21:00) ---
  .refine(
    (data) => {
      // Validamos que inicio >= 08:00 y fin <= 21:00
      return data.horaInicio >= "08:00" && data.horaFin <= "21:00";
    },
    {
      message: "El horario de clase debe estar entre las 08:00 y las 21:00 hs",
      path: ["horaFin"],
    },
  )
  // --- Refine 3: Duración Máxima (4 horas) ---
  .refine(
    (data) => {
      const [startH, startM] = data.horaInicio.split(":").map(Number);
      const [endH, endM] = data.horaFin.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes - startMinutes <= 4 * 60; // Máximo 240 minutos
    },
    {
      message: "La duración máxima de una clase es de 4 horas",
      path: ["horaFin"],
    },
  )
  // --- Refine 4: Validar que no sea en el pasado ---
  .refine(
    (data) => {
      const [year, month, day] = data.fechaClase.split("-").map(Number);
      const [hours, minutes] = data.horaInicio.split(":").map(Number);

      const fechaInicio = new Date(year, month - 1, day, hours, minutes);
      const ahora = new Date();

      // Permitimos un margen de 1 minuto por si acaso
      return fechaInicio.getTime() > ahora.getTime() - 60000;
    },
    {
      message: "No puedes programar una clase en el pasado.",
      path: ["horaInicio"],
    },
  );

// Exportamos los tipos inferidos
export type CreateClaseConsultaFormValues = z.infer<typeof claseConsultaSchema>;
export type UpdateClaseConsultaFormValues = CreateClaseConsultaFormValues; // Usamos el mismo tipo estricto

// Exportamos los esquemas con los nombres que espera el componente
export const createClaseConsultaSchema = claseConsultaSchema;
export const updateClaseConsultaSchema = claseConsultaSchema; // Usamos el mismo esquema estricto
