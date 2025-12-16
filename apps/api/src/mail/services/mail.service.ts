import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import { EmailBienvenida } from '../emails/EmailBienvenida';
import NuevaClaseAutomaticaEmail from '../emails/NuevaClaseAutomaticaEmail';
import { DiaClase, dias_semana } from '@prisma/client';
import NuevaSesionAutomaticaEmail from '../emails/NuevaSesionAutomaticaEmail';

// Mapa para convertir Enum Prisma a índice JS (0=Domingo, 1=Lunes...)
const MAPA_DIAS: Record<dias_semana, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
};

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async enviarBienvenida(email: string, nombre: string, contrasena: string) {
    // 1. Renderizamos el HTML
    const html = await render(
      EmailBienvenida({
        nombre: nombre,
        contrasena: contrasena,
      }),
    );

    // 2. Enviamos
    await this.mailerService.sendMail({
      to: email,
      subject: '¡Bienvenido a Algoritmia! 🎮',
      html: html,
    });
  }

  // --- 2. AVISO DE CLASE AUTOMÁTICA (Docentes) ---
  async enviarAvisoClaseAutomatica(
    destinatarios: { email: string; nombre: string }[],
    datos: {
      idClase: string;
      nombreCurso: string;
      fechaOriginal: Date;
      cantidadConsultas: number;
      diasClaseConfig: DiaClase[]; // Necesario para calcular la reprogramación
    },
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 1. Calcular la "Siguiente Fecha" (Opción de Reprogramar)
    // Simulamos estar 1 hora después de la clase original para encontrar la próxima
    const fechaFuturaBase = new Date(datos.fechaOriginal);
    fechaFuturaBase.setHours(fechaFuturaBase.getHours() + 1);

    const fechaSiguiente =
      this.calcularProximaOcurrencia(datos.diasClaseConfig, fechaFuturaBase) ||
      fechaFuturaBase; // Fallback a la misma si falla

    // 2. Formateadores de texto
    const fmt = (d: Date) =>
      d.toLocaleString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      }) + ' hs';

    // 3. Enviar a cada docente
    for (const docente of destinatarios) {
      // Construimos links con Query Params para el Frontend
      const baseLink = `${baseUrl}/course/consult-classes?id=${datos.idClase}`;

      const html = await render(
        NuevaClaseAutomaticaEmail({
          nombreDocente: docente.nombre,
          nombreCurso: datos.nombreCurso,
          cantidadConsultas: datos.cantidadConsultas,

          // Textos para mostrar
          fechaClase: fmt(datos.fechaOriginal),
          fechaSiguienteClase: fmt(fechaSiguiente),

          // Links de Acción
          linkAceptar: `${baseLink}&action=accept`,
          linkReprogramar: `${baseLink}&action=reschedule&date=${fechaSiguiente.toISOString()}`,
          linkManual: `${baseLink}&action=edit_manual`,
        }),
      );

      await this.mailerService.sendMail({
        to: docente.email,
        subject: `🔔 Acción Requerida: Clase Automática en ${datos.nombreCurso}`,
        html: html,
      });
    }
  }

  // --- 3. AVISO DE SESIÓN AUTOMÁTICA (Alumnos) ---
  async enviarNotificacionSesionAutomatica(datos: {
    email: string;
    nombreAlumno: string;
    nombreCurso: string;
    nombreDificultad: string;
    fechaLimite: Date;
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkSesion = `${baseUrl}/my/sessions`;

    const fechaLegible = datos.fechaLimite.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = await render(
      NuevaSesionAutomaticaEmail({
        nombreAlumno: datos.nombreAlumno,
        nombreCurso: datos.nombreCurso,
        nombreDificultad: datos.nombreDificultad,
        fechaLimite: fechaLegible,
        linkSesion: linkSesion,
      }),
    );

    await this.mailerService.sendMail({
      to: datos.email,
      subject: `📚 Nueva Sesión de Refuerzo: ${datos.nombreDificultad}`,
      html: html,
    });
  }

  /**
   * HELPER PRIVADO: Calcula la próxima fecha de clase a partir de una fecha base.
   * (Lógica autocontenida para no depender de archivos externos)
   */
  private calcularProximaOcurrencia(
    diasClase: DiaClase[],
    desde: Date,
  ): Date | null {
    if (!diasClase || diasClase.length === 0) return null;

    const fechaBase = new Date(desde);
    let candidatos: Date[] = [];

    // Buscamos en los próximos 21 días
    for (let i = 0; i < 21; i++) {
      const fechaFutura = new Date(fechaBase);
      fechaFutura.setDate(fechaBase.getDate() + i);

      const diaSemanaJS = fechaFutura.getDay(); // 0-6

      // Verificamos si el curso tiene clase este día
      const clasesDelDia = diasClase.filter(
        (d) => MAPA_DIAS[d.dia] === diaSemanaJS,
      );

      for (const clase of clasesDelDia) {
        const horaInicio = new Date(clase.horaInicio); // La hora base (ej. 1970-01-01T14:00...)

        // Configuramos la fecha candidata
        const fechaCandidata = new Date(fechaFutura);
        fechaCandidata.setHours(
          horaInicio.getHours() - 1, // Regla: 1 hora antes de la clase
          horaInicio.getMinutes(),
          0,
          0,
        );

        // Debe ser estrictamente mayor a la fecha 'desde'
        if (fechaCandidata > desde) {
          candidatos.push(fechaCandidata);
        }
      }
    }

    // Ordenamos cronológicamente y devolvemos la primera
    candidatos.sort((a, b) => a.getTime() - b.getTime());
    return candidatos.length > 0 ? candidatos[0] : null;
  }
}
