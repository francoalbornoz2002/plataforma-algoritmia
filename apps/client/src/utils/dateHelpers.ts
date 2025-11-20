// src/utils/dateHelpers.ts

/**
 * Convierte un string de tiempo "HH:mm" a un objeto Date
 * usando la zona horaria LOCAL del navegador.
 */
export function timeToDate(timeString: string): Date | null {
  if (!timeString || !timeString.includes(":")) {
    return null;
  }

  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}
