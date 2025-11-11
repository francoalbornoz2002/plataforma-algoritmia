// src/utils/dateHelpers.ts

/**
 * Convierte un string de tiempo "HH:mm" a un objeto Date (en 1970)
 * para que el TimePicker de MUI lo pueda leer.
 */
export function timeToDate(timeString: string): Date | null {
  if (!timeString || !timeString.includes(":")) {
    return null; // Devuelve null si el formato es inválido
  }
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date(0); // 1970-01-01T00:00:00.000Z
  date.setUTCHours(hours);
  date.setUTCMinutes(minutes);
  return date;
}
