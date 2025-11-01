// Función helper para convertir "HH:mm" a un objeto Date (que Prisma espera para Time)
export function timeToDate(time: string): Date {
  // Usamos una fecha dummy, solo la hora importa
  return new Date(`1970-01-01T${time}:00Z`);
}

// Función helper para convertir Date a "HH:mm"
export function dateToTime(date: Date): string {
  if (!date) return '00:00';
  return date.toISOString().substr(11, 5);
}
