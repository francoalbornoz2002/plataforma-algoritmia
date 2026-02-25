import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiaClase, dias_semana } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { calcularFechaProximaClase } from '../../helpers';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

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
   * Método privado para realizar el envío de forma segura.
   * Evita que el servidor se caiga si el servicio de correos no está disponible.
   */
  private async safeSendMail(options: ISendMailOptions): Promise<boolean> {
    try {
      await this.mailerService.sendMail(options);
      return true;
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo a ${options.to}. ¿Está Mailpit/Docker activo?`,
        error.stack,
      );
      return false;
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

    await this.safeSendMail({
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

    await this.safeSendMail({
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
      calcularFechaProximaClase(datos.diasClaseConfig, fechaFuturaBase) ||
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

      await this.safeSendMail({
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

    await this.safeSendMail({
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

    await this.safeSendMail({
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
      await this.safeSendMail({
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

    await this.safeSendMail({
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

    await this.safeSendMail({
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
      await this.safeSendMail({
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

  // --- 9. AVISO DE CANCELACIÓN DE CLASE (Alumnos) ---
  async enviarAvisoCancelacionClase(
    destinatarios: {
      email: string;
      nombre: string;
    }[],
    datos: {
      nombreClase: string;
      fechaClase: Date;
      motivo: string;
      nombreDocente: string;
    },
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkClases = `${baseUrl}/my/consult-classes`;

    const fechaLegible = datos.fechaClase.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    for (const alumno of destinatarios) {
      await this.safeSendMail({
        to: alumno.email,
        subject: `🚫 Clase Cancelada: ${datos.nombreClase}`,
        template: 'clase-cancelada',
        context: {
          ...baseContext,
          emailTitle: 'Aviso de Cancelación',
          nombreAlumno: alumno.nombre,
          nombreClase: datos.nombreClase,
          fechaClase: fechaLegible,
          motivo: datos.motivo,
          nombreDocente: datos.nombreDocente,
          linkClases,
        },
      });
    }
  }

  // --- 10. RECORDATORIO PENDIENTE ASIGNACIÓN (Docentes) ---
  async enviarRecordatorioPendienteDocentes(
    destinatarios: { email: string; nombre: string }[],
    datos: {
      nombreClase: string;
      nombreCurso: string;
      fechaClase: Date;
      horasRestantes: number;
      esUltimoAviso: boolean;
      idClase: string;
    },
  ): Promise<boolean> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkClase = `${baseUrl}/course/consult-classes?id=${datos.idClase}`;
    const fechaLegible = datos.fechaClase.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (destinatarios.length === 0) return true; // No hay a quien enviar, se considera éxito para no bloquear

    let algunEnvioExitoso = false;
    for (const docente of destinatarios) {
      const enviado = await this.safeSendMail({
        to: docente.email,
        subject: datos.esUltimoAviso
          ? `⚠️ ÚLTIMO AVISO: Clase Pendiente en ${datos.nombreCurso}`
          : `⏳ Recordatorio: Clase Pendiente en ${datos.nombreCurso}`,
        template: 'recordatorio-pendiente-docentes',
        context: {
          ...baseContext,
          emailTitle: 'Recordatorio de Asignación',
          nombreClase: datos.nombreClase,
          nombreCurso: datos.nombreCurso,
          fechaClase: fechaLegible,
          horasRestantes: Math.max(0, Math.floor(datos.horasRestantes)),
          esUltimoAviso: datos.esUltimoAviso,
          linkClase,
        },
      });
      if (enviado) algunEnvioExitoso = true;
    }

    return algunEnvioExitoso;
  }

  // --- 11. ASIGNACIÓN FORZADA (Docente) ---
  async enviarAsignacionForzadaDocente(
    email: string,
    nombreDocente: string,
    datos: {
      nombreClase: string;
      nombreCurso: string;
      fechaClase: Date;
      idClase: string;
    },
  ): Promise<boolean> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseContext = await this.getBaseContext();
    const linkClase = `${baseUrl}/course/consult-classes?id=${datos.idClase}`;
    const fechaLegible = datos.fechaClase.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.safeSendMail({
      to: email,
      subject: `📢 Asignación Automática: ${datos.nombreClase}`,
      template: 'asignacion-forzada-docente',
      context: {
        ...baseContext,
        emailTitle: 'Asignación Automática',
        nombreDocente,
        nombreClase: datos.nombreClase,
        nombreCurso: datos.nombreCurso,
        fechaClase: fechaLegible,
        linkClase,
      },
    });
  }
}
