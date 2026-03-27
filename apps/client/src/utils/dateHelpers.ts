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

/**
 * Formatea una fecha a un formato detallado: "Día, DD/MM/YYYY a las HH:mm"
 * Ej: "Lunes, 01/01/2024 a las 10:00"
 */
export function formatDetailedDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const diaSemana = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
  }).format(date);
  const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const fechaStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  const horaStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  return `${diaCap}, ${fechaStr} a las ${horaStr}`;
}
