import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiaClase, dias_semana } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';

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
export class MailService implements OnModuleInit {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.registerPartials();
  }

  /**
   * Registra manualmente los partials de Handlebars leyendo los archivos del disco.
   * Esto soluciona los problemas de resolución de rutas del adaptador.
   */
  private async registerPartials() {
    const partialsDir = path.join(
      process.cwd(),
      'dist',
      'src',
      'mail',
      'templates',
      'partials',
    );

    try {
      const styles = await fs.readFile(
        path.join(partialsDir, 'styles.hbs'),
        'utf-8',
      );
      const header = await fs.readFile(
        path.join(partialsDir, 'header.hbs'),
        'utf-8',
      );
      const footer = await fs.readFile(
        path.join(partialsDir, 'footer.hbs'),
        'utf-8',
      );

      Handlebars.registerPartial('styles', styles);
      Handlebars.registerPartial('header', header);
      Handlebars.registerPartial('footer', footer);
    } catch (error) {
      console.error('Error registrando partials manualmente:', error);
    }
  }

  /**
   * Obtiene el contexto común para todos los correos (Institución, Año, etc.)
   */
  private async getBaseContext() {
    const institucion = await this.prisma.institucion.findFirst({
      include: {
        localidad: {
          include: {
            provincia: true,
          },
        },
      },
    });

    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    return {
      year: new Date().getFullYear(),
      institucion: institucion
        ? {
            nombre: institucion.nombre,
            direccion: `${institucion.direccion}, ${institucion.localidad.localidad}, ${institucion.localidad.provincia.provincia}`,
            telefono: institucion.telefono,
            email: institucion.email,
            logoUrl: institucion.logoUrl
              ? `${apiUrl}${institucion.logoUrl}`
              : null,
          }
        : null,
    };
  }

  async enviarBienvenida(email: string, nombre: string, contrasena: string) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();

    await this.mailerService.sendMail({
      to: email,
      subject: '¡Bienvenido a Algoritmia! 🎮',
      template: 'bienvenida', // Nombre del archivo .hbs sin extensión
      context: {
        ...baseContext,
        emailTitle: '¡Bienvenido a Algoritmia! 🎮',
        nombre,
        email, // Para mostrar el usuario
        contrasena,
        loginUrl: `${baseUrl}/login`,
      },
    });
  }

  async enviarRestablecerContrasena(
    email: string,
    nombre: string,
    token: string,
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Restablecer Contraseña - Algoritmia 🔐',
      template: 'restablecer-contrasena',
      context: {
        ...baseContext,
        emailTitle: 'Restablecer Contraseña',
        nombre,
        resetUrl,
      },
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
    const baseContext = await this.getBaseContext();

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

      await this.mailerService.sendMail({
        to: docente.email,
        subject: `🔔 Acción Requerida: Clase Automática en ${datos.nombreCurso}`,
        template: 'clase-automatica',
        context: {
          ...baseContext,
          emailTitle: 'Nueva Clase de Consulta Automática',
          nombreDocente: docente.nombre,
          nombreCurso: datos.nombreCurso,
          cantidadConsultas: datos.cantidadConsultas,
          fechaClase: fmt(datos.fechaOriginal),
          fechaSiguienteClase: fmt(fechaSiguiente),
          linkAceptar: `${baseLink}&action=accept`,
          linkReprogramar: `${baseLink}&action=reschedule&date=${fechaSiguiente.toISOString()}`,
          linkManual: `${baseLink}&action=edit_manual`,
        },
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
    const baseContext = await this.getBaseContext();
    const linkSesion = `${baseUrl}/my/sessions`;

    const fechaLegible = datos.fechaLimite.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.mailerService.sendMail({
      to: datos.email,
      subject: `📚 Nueva Sesión de Refuerzo: ${datos.nombreDificultad}`,
      template: 'sesion-automatica',
      context: {
        ...baseContext,
        emailTitle: 'Nueva Sesión de Refuerzo Automática 📚',
        nombreAlumno: datos.nombreAlumno,
        nombreCurso: datos.nombreCurso,
        nombreDificultad: datos.nombreDificultad,
        fechaLimite: fechaLegible,
        linkSesion: linkSesion,
      },
    });
  }

  // --- 4. BIENVENIDA AL CURSO (Docentes) ---
  async enviarBienvenidaCursoDocente(
    email: string,
    nombreDocente: string,
    datosCurso: {
      nombre: string;
      descripcion: string;
      diasClase: string;
      contrasena: string;
      idCurso: string;
    },
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();

    await this.mailerService.sendMail({
      to: email,
      subject: `Asignación al curso: ${datosCurso.nombre}`,
      template: 'bienvenida-curso-docente',
      context: {
        ...baseContext,
        emailTitle: 'Nuevo Curso Asignado',
        nombreDocente,
        nombreCurso: datosCurso.nombre,
        descripcionCurso: datosCurso.descripcion,
        diasClase: datosCurso.diasClase,
        contrasena: datosCurso.contrasena,
        linkCurso: `${baseUrl}/course/dashboard`, // Redirige al dashboard general
      },
    });
  }

  // --- 5. NUEVA CONSULTA (Docentes) ---
  async enviarNuevaConsultaDocente(
    destinatarios: { email: string; nombre: string }[],
    datos: {
      nombreAlumno: string;
      nombreCurso: string;
      tema: string;
      titulo: string;
      descripcion: string;
      idCurso: string;
    },
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkResponder = `${baseUrl}/course/consults`; // Link a la lista de consultas

    for (const docente of destinatarios) {
      await this.mailerService.sendMail({
        to: docente.email,
        subject: `Nueva Consulta en ${datos.nombreCurso}: ${datos.titulo}`,
        template: 'nueva-consulta-docente',
        context: {
          ...baseContext,
          emailTitle: 'Nueva Consulta de Alumno',
          nombreDocente: docente.nombre,
          nombreAlumno: datos.nombreAlumno,
          nombreCurso: datos.nombreCurso,
          tema: datos.tema,
          tituloConsulta: datos.titulo,
          descripcionConsulta: datos.descripcion,
          linkResponder,
        },
      });
    }
  }

  // --- 6. CONSULTA RESPONDIDA (Alumno) ---
  async enviarConsultaRespondidaAlumno(datos: {
    email: string;
    nombreAlumno: string;
    nombreDocente: string;
    tituloConsulta: string;
    respuesta: string;
    idCurso: string;
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkValorar = `${baseUrl}/my/consults`;

    await this.mailerService.sendMail({
      to: datos.email,
      subject: `Respuesta a tu consulta: ${datos.tituloConsulta}`,
      template: 'consulta-respondida-alumno',
      context: {
        ...baseContext,
        emailTitle: 'Consulta Respondida',
        nombreAlumno: datos.nombreAlumno,
        nombreDocente: datos.nombreDocente,
        tituloConsulta: datos.tituloConsulta,
        respuestaDocente: datos.respuesta,
        linkValorar,
      },
    });
  }

  // --- 7. SESIÓN ASIGNADA (Alumno) ---
  async enviarSesionAsignadaAlumno(datos: {
    email: string;
    nombreAlumno: string;
    nombreDocente: string;
    nombreCurso: string;
    dificultad: string;
    grado: string;
    fechaLimite: Date;
    tiempoLimite: number;
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkSesion = `${baseUrl}/my/sessions`;

    await this.mailerService.sendMail({
      to: datos.email,
      subject: `Sesión de Refuerzo Asignada: ${datos.dificultad}`,
      template: 'sesion-asignada',
      context: {
        ...baseContext,
        emailTitle: 'Nueva Sesión Asignada',
        nombreAlumno: datos.nombreAlumno,
        nombreDocente: datos.nombreDocente,
        nombreCurso: datos.nombreCurso,
        dificultad: datos.dificultad,
        grado: datos.grado,
        fechaLimite: datos.fechaLimite.toLocaleString('es-AR'),
        tiempoLimite: datos.tiempoLimite,
        linkSesion,
      },
    });
  }

  // --- 8. CLASE DE CONSULTA PROGRAMADA (Alumnos) ---
  async enviarAvisoClaseConsultaAlumno(
    destinatarios: {
      email: string;
      nombre: string;
      consultas: string[]; // Títulos de sus consultas
    }[],
    datosClase: {
      nombreClase: string;
      nombreDocente: string;
      fechaInicio: Date;
      modalidad: string;
      idClase: string;
    },
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkClase = `${baseUrl}/my/consult-classes`;

    const fechaLegible = datosClase.fechaInicio.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    for (const alumno of destinatarios) {
      await this.mailerService.sendMail({
        to: alumno.email,
        subject: `📅 Clase de Consulta Programada: ${datosClase.nombreClase}`,
        template: 'clase-consulta-alumno',
        context: {
          ...baseContext,
          emailTitle: 'Clase de Consulta Programada',
          nombreAlumno: alumno.nombre,
          nombreClase: datosClase.nombreClase,
          nombreDocente: datosClase.nombreDocente,
          fechaHora: fechaLegible,
          modalidad: datosClase.modalidad,
          consultas: alumno.consultas,
          linkClase,
        },
      });
    }
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
