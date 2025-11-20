import { dias_semana, DiaClase } from '@prisma/client';

// Función helper para convertir "HH:mm" (hora Argentina) a un objeto Date UTC
export function timeToDate(time: string): Date {
  // Validación por seguridad
  if (!time) return new Date(0);

  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(0); // Fecha epoch (1970-01-01T00:00:00.000Z)

  // TRUCO: Sumamos 3 horas.
  // "08:00" Argentina se convierte en "11:00" UTC.
  date.setUTCHours(hours + 3);
  date.setUTCMinutes(minutes);

  return date;
}

// Función helper para convertir Date a "HH:mm"
export function dateToTime(date: Date): string {
  if (!date) return '00:00';

  // Creamos una copia para no mutar el objeto original
  const d = new Date(date);

  // Restamos las 3 horas para volver a la hora local "humana"
  // "11:00" UTC se convierte en "08:00" para mostrarse
  d.setUTCHours(d.getUTCHours() - 3);

  // Extraemos HH:mm
  return d.toISOString().substring(11, 16);
}

/**
 * Mapa para convertir el Enum de Prisma (String) al índice de Date.getDay() (Number)
 * 0 = Domingo, 1 = Lunes, ... 6 = Sábado
 */
const MAPA_DIAS: Record<dias_semana, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
};

/**
 * Calcula la fecha y hora para la próxima clase de consulta automática.
 * Regla: 1 hora antes del inicio de la próxima clase del curso.
 * * @param diasClase Lista de horarios configurados para el curso
 * @returns Date La fecha de inicio de la clase de consulta
 */
export function calcularFechaProximaClase(diasClase: DiaClase[]): Date | null {
  if (!diasClase || diasClase.length === 0) {
    return null; // El curso no tiene horarios definidos
  }

  const ahora = new Date();
  let candidatos: Date[] = [];

  // Iteramos los próximos 14 días para encontrar la ocurrencia más cercana
  // (14 días cubre casos donde la clase sea quincenal o feriados, por seguridad)
  for (let i = 0; i < 14; i++) {
    const fechaFutura = new Date(ahora);
    fechaFutura.setDate(ahora.getDate() + i);

    const diaIndiceFuturo = fechaFutura.getDay();

    // Buscamos si el curso tiene clase en este día de la semana (0-6)
    const clasesDelDia = diasClase.filter(
      (d) => MAPA_DIAS[d.dia] === diaIndiceFuturo,
    );

    for (const clase of clasesDelDia) {
      // Prisma devuelve DateTime, pero solo nos importa la HORA y MINUTO.
      // Extraemos la hora de inicio de la clase.
      const horaInicioClase = new Date(clase.horaInicio);

      // Creamos la fecha candidata combinando el Día Futuro + Hora Clase
      const fechaCandidata = new Date(fechaFutura);
      fechaCandidata.setHours(
        horaInicioClase.getHours() - 1, // <--- REGLA: 1 hora antes
        horaInicioClase.getMinutes(),
        0,
        0,
      );

      // Validación Clave:
      // La clase de consulta debe ser en el FUTURO.
      // Ejemplo: Si hoy es Lunes 14:00 y la clase es Lunes 14:00,
      // la consulta sería Lunes 13:00. Eso es pasado.
      // El sistema debe ignorarla y buscar la del Lunes siguiente (u otro día).
      if (fechaCandidata > ahora) {
        candidatos.push(fechaCandidata);
      }
    }
  }

  // Ordenamos los candidatos por fecha (el más cercano primero)
  candidatos.sort((a, b) => a.getTime() - b.getTime());

  // Devolvemos la primera opción (la más cercana)
  return candidatos.length > 0 ? candidatos[0] : null;
}
