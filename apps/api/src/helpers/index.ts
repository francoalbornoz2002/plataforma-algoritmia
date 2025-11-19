import { dias_semana, DiaClase } from '@prisma/client';

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
