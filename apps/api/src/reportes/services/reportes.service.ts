import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUsersSummaryDto } from '../dto/get-users-summary.dto';
import {
  GetUsersDistributionDto,
  AgrupacionUsuarios,
} from '../dto/get-users-distribution.dto';
import { GetUsersHistoryDto } from '../dto/get-users-history.dto';
import { GetUsersListDto } from '../dto/get-users-list.dto';
import { GetCoursesSummaryDto } from '../dto/get-courses-summary.dto';
import { GetCoursesListDto } from '../dto/get-courses-list.dto';
import {
  GetCoursesHistoryDto,
  TipoMovimientoCurso,
} from '../dto/get-courses-history.dto';
import {
  GetStudentEnrollmentHistoryDto,
  TipoMovimientoInscripcion,
} from '../dto/get-student-enrollment-history.dto';
import {
  GetTeacherAssignmentHistoryDto,
  TipoMovimientoAsignacion,
} from '../dto/get-teacher-assignment-history.dto';
import { GetCourseMissionsReportDto } from '../dto/get-course-missions-report.dto';
import { GetCourseMissionDetailReportDto } from '../dto/get-course-mission-detail-report.dto';
import { GetCourseProgressSummaryDto } from '../dto/get-course-progress-summary.dto';
import { dateToTime } from '../../helpers';
import {
  estado_simple,
  grado_dificultad,
  Prisma,
  estado_consulta,
} from '@prisma/client';
import { GetCourseDifficultiesReportDto } from '../dto/get-course-difficulties-report.dto';
import { GetCourseDifficultiesHistoryDto } from '../dto/get-course-difficulties-history.dto';
import { GetStudentDifficultiesReportDto } from '../dto/get-student-difficulties-report.dto';
import { GetCourseConsultationsSummaryDto } from '../dto/get-course-consultations-summary.dto';
import { GetCourseConsultationsHistoryDto } from '../dto/get-course-consultations-history.dto';
import { GetCourseClassesSummaryDto } from '../dto/get-course-classes-summary.dto';
import { GetCourseClassesHistoryDto } from '../dto/get-course-classes-history.dto';
import { GetCourseSessionsSummaryDto } from '../dto/get-course-sessions-summary.dto';
import {
  temas,
  fuente_cambio_dificultad,
  estado_clase_consulta,
  estado_sesion,
} from '@prisma/client';

const TOTAL_MISIONES = 10;

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersSummary(dto: GetUsersSummaryDto) {
    const { fechaCorte } = dto;
    const end = fechaCorte ? new Date(fechaCorte) : new Date();
    if (fechaCorte) {
      end.setUTCHours(23, 59, 59, 999);
    }

    // Base: Usuarios creados antes o en la fecha de corte
    const whereBase: Prisma.UsuarioWhereInput = {
      createdAt: { lte: end },
    };

    // Activos: (No borrados) O (Borrados DESPUÉS de la fecha de corte)
    const whereActive: Prisma.UsuarioWhereInput = {
      ...whereBase,
      OR: [{ deletedAt: null }, { deletedAt: { gt: end } }],
    };

    // Inactivos: (Borrados) Y (Borrados ANTES o EN la fecha de corte)
    const whereInactive: Prisma.UsuarioWhereInput = {
      ...whereBase,
      deletedAt: { lte: end, not: null },
    };

    const [total, activos, inactivos] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where: whereBase }),
      this.prisma.usuario.count({ where: whereActive }),
      this.prisma.usuario.count({ where: whereInactive }),
    ]);

    return { total, activos, inactivos };
  }

  async getUsersDistribution(dto: GetUsersDistributionDto) {
    const { fechaCorte, agruparPor } = dto;
    const end = fechaCorte ? new Date(fechaCorte) : new Date();
    if (fechaCorte) {
      end.setUTCHours(23, 59, 59, 999);
    }

    // Traemos los datos mínimos necesarios para agrupar en memoria
    // (Es más seguro para la lógica de "estado histórico" que SQL puro complejo)
    const users = await this.prisma.usuario.findMany({
      where: { createdAt: { lte: end } },
      select: { rol: true, deletedAt: true },
    });

    const distribution: any[] = [];

    if (agruparPor === AgrupacionUsuarios.ROL) {
      const groups: Record<string, number> = {};
      users.forEach((u) => {
        groups[u.rol] = (groups[u.rol] || 0) + 1;
      });
      for (const [grupo, cantidad] of Object.entries(groups)) {
        distribution.push({ grupo, cantidad });
      }
    } else if (agruparPor === AgrupacionUsuarios.ESTADO) {
      let activos = 0;
      let inactivos = 0;
      users.forEach((u) => {
        const isActive = !u.deletedAt || u.deletedAt > end;
        if (isActive) activos++;
        else inactivos++;
      });
      distribution.push({ grupo: 'Activo', cantidad: activos });
      distribution.push({ grupo: 'Inactivo', cantidad: inactivos });
    } else {
      // AMBOS
      const groups: Record<string, number> = {};
      users.forEach((u) => {
        const isActive = !u.deletedAt || u.deletedAt > end;
        const estado = isActive ? 'Activo' : 'Inactivo';
        const key = `${u.rol}|${estado}`;
        groups[key] = (groups[key] || 0) + 1;
      });
      for (const [key, cantidad] of Object.entries(groups)) {
        const [rol, estado] = key.split('|');
        distribution.push({ rol, estado, cantidad });
      }
    }

    return distribution;
  }

  async getUsersAltas(dto: GetUsersHistoryDto) {
    const { fechaDesde, fechaHasta, rol } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);

    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const where: Prisma.UsuarioWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    if (rol) where.rol = rol;

    const users = await this.prisma.usuario.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    // Generamos metadatos para gráficos (agrupado por día)
    const meta: Record<string, number> = {};
    users.forEach((u) => {
      const dateKey = u.createdAt.toISOString().split('T')[0];
      meta[dateKey] = (meta[dateKey] || 0) + 1;
    });

    return {
      data: users,
      meta: Object.entries(meta).map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      })),
    };
  }

  async getUsersBajas(dto: GetUsersHistoryDto) {
    const { fechaDesde, fechaHasta, rol } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);

    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const where: Prisma.UsuarioWhereInput = {
      deletedAt: { gte: start, lte: end },
    };
    if (rol) where.rol = rol;

    const users = await this.prisma.usuario.findMany({
      where,
      orderBy: { deletedAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    // Generamos metadatos para gráficos (agrupado por día de baja)
    const meta: Record<string, number> = {};
    users.forEach((u) => {
      if (u.deletedAt) {
        const dateKey = u.deletedAt.toISOString().split('T')[0];
        meta[dateKey] = (meta[dateKey] || 0) + 1;
      }
    });

    return {
      data: users,
      meta: Object.entries(meta).map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      })),
    };
  }

  async getUsersList(dto: GetUsersListDto) {
    const { fechaCorte, rol } = dto;
    const end = fechaCorte ? new Date(fechaCorte) : new Date();
    if (fechaCorte) {
      end.setUTCHours(23, 59, 59, 999);
    }

    const where: Prisma.UsuarioWhereInput = {
      createdAt: { lte: end },
    };
    if (rol) where.rol = rol;

    const users = await this.prisma.usuario.findMany({
      where,
      orderBy: { apellido: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        rol: true,
        genero: true,
        createdAt: true,
        deletedAt: true,
        ultimoAcceso: true,
      },
    });

    // Calculamos el estado histórico para cada usuario
    return users.map((u) => {
      const isActive = !u.deletedAt || u.deletedAt > end;
      return {
        ...u,
        estado: isActive ? 'Activo' : 'Inactivo',
        // Opcional: Si queremos ser estrictos con el reporte histórico,
        // podríamos ocultar el deletedAt si ocurrió después de la fecha de corte.
        deletedAt: isActive ? null : u.deletedAt,
      };
    });
  }

  // --- REPORTES DE CURSOS (ADMIN) ---

  async getCoursesSummary(dto: GetCoursesSummaryDto) {
    const { fechaCorte } = dto;
    const end = fechaCorte ? new Date(fechaCorte) : new Date();
    if (fechaCorte) {
      end.setUTCHours(23, 59, 59, 999);
    }

    // Base: Cursos creados antes o en la fecha de corte
    const whereBase: Prisma.CursoWhereInput = {
      createdAt: { lte: end },
    };

    // Activos: (No borrados) O (Borrados DESPUÉS de la fecha de corte)
    const whereActive: Prisma.CursoWhereInput = {
      ...whereBase,
      OR: [{ deletedAt: null }, { deletedAt: { gt: end } }],
    };

    // Inactivos: (Borrados) Y (Borrados ANTES o EN la fecha de corte)
    const whereInactive: Prisma.CursoWhereInput = {
      ...whereBase,
      deletedAt: { lte: end, not: null },
    };

    const [total, activos, inactivos] = await this.prisma.$transaction([
      this.prisma.curso.count({ where: whereBase }),
      this.prisma.curso.count({ where: whereActive }),
      this.prisma.curso.count({ where: whereInactive }),
    ]);

    return { total, activos, inactivos };
  }

  async getCoursesList(dto: GetCoursesListDto) {
    const { fechaCorte, estado, search } = dto;
    const end = fechaCorte ? new Date(fechaCorte) : new Date();
    if (fechaCorte) {
      end.setUTCHours(23, 59, 59, 999);
    }

    const where: Prisma.CursoWhereInput = {
      createdAt: { lte: end },
    };

    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }

    if (estado === estado_simple.Activo) {
      where.OR = [{ deletedAt: null }, { deletedAt: { gt: end } }];
    } else if (estado === estado_simple.Inactivo) {
      where.deletedAt = { lte: end, not: null };
    }

    const courses = await this.prisma.curso.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        deletedAt: true,
        createdAt: true,
        alumnos: {
          where: { fechaInscripcion: { lte: end } },
          select: { fechaBaja: true },
        },
        docentes: {
          where: { fechaAsignacion: { lte: end } },
          select: { fechaBaja: true },
        },
      },
    });

    return courses.map((c) => {
      const isActive = !c.deletedAt || c.deletedAt > end;

      let alumnosActivos = 0;
      let alumnosInactivos = 0;
      c.alumnos.forEach((a) => {
        if (!a.fechaBaja || a.fechaBaja > end) alumnosActivos++;
        else alumnosInactivos++;
      });

      let docentesActivos = 0;
      let docentesInactivos = 0;
      c.docentes.forEach((d) => {
        if (!d.fechaBaja || d.fechaBaja > end) docentesActivos++;
        else docentesInactivos++;
      });

      return {
        id: c.id,
        nombre: c.nombre,
        estado: isActive ? 'Activo' : 'Inactivo',
        createdAt: c.createdAt,
        deletedAt: isActive ? null : c.deletedAt,
        alumnos: { activos: alumnosActivos, inactivos: alumnosInactivos },
        docentes: { activos: docentesActivos, inactivos: docentesInactivos },
      };
    });
  }

  async getCoursesHistory(dto: GetCoursesHistoryDto) {
    const { fechaDesde, fechaHasta, tipoMovimiento } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const events: any[] = [];

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoCurso.TODOS ||
      tipoMovimiento === TipoMovimientoCurso.ALTA
    ) {
      const altas = await this.prisma.curso.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          nombre: true,
          createdAt: true,
          docentes: {
            select: {
              fechaAsignacion: true,
              docente: { select: { nombre: true, apellido: true } },
            },
          },
          diasClase: true,
        },
      });
      altas.forEach((c) => {
        events.push({
          tipo: 'Alta',
          fecha: c.createdAt,
          curso: c.nombre,
          detalle: {
            docentes: c.docentes
              .filter(
                (d) =>
                  Math.abs(
                    d.fechaAsignacion.getTime() - c.createdAt.getTime(),
                  ) < 10000,
              )
              .map((d) => `${d.docente.nombre} ${d.docente.apellido}`)
              .join(', '),
            dias: c.diasClase
              .map(
                (d) =>
                  `${d.dia} (${dateToTime(d.horaInicio)} - ${dateToTime(d.horaFin)})`,
              )
              .join(', '),
          },
        });
      });
    }

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoCurso.TODOS ||
      tipoMovimiento === TipoMovimientoCurso.BAJA
    ) {
      const bajas = await this.prisma.curso.findMany({
        where: { deletedAt: { gte: start, lte: end } },
        select: {
          id: true,
          nombre: true,
          deletedAt: true,
        },
      });
      bajas.forEach((c) => {
        events.push({
          tipo: 'Baja',
          fecha: c.deletedAt!,
          curso: c.nombre,
          detalle: '-',
        });
      });
    }

    return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async getStudentEnrollmentHistory(dto: GetStudentEnrollmentHistoryDto) {
    const { fechaDesde, fechaHasta, tipoMovimiento, cursoId } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const events: any[] = [];

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoInscripcion.TODOS ||
      tipoMovimiento === TipoMovimientoInscripcion.INSCRIPCION
    ) {
      const where: Prisma.AlumnoCursoWhereInput = {
        fechaInscripcion: { gte: start, lte: end },
      };
      if (cursoId) where.idCurso = cursoId;

      const inscripciones = await this.prisma.alumnoCurso.findMany({
        where,
        include: {
          alumno: { select: { nombre: true, apellido: true } },
          curso: { select: { nombre: true } },
        },
      });
      inscripciones.forEach((i) => {
        events.push({
          tipo: 'Inscripción',
          fecha: i.fechaInscripcion,
          alumno: `${i.alumno.nombre} ${i.alumno.apellido}`,
          curso: i.curso.nombre,
        });
      });
    }

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoInscripcion.TODOS ||
      tipoMovimiento === TipoMovimientoInscripcion.BAJA
    ) {
      const where: Prisma.AlumnoCursoWhereInput = {
        fechaBaja: { gte: start, lte: end },
      };
      if (cursoId) where.idCurso = cursoId;

      const bajas = await this.prisma.alumnoCurso.findMany({
        where,
        include: {
          alumno: { select: { nombre: true, apellido: true } },
          curso: { select: { nombre: true } },
        },
      });
      bajas.forEach((i) => {
        events.push({
          tipo: 'Baja',
          fecha: i.fechaBaja!,
          alumno: `${i.alumno.nombre} ${i.alumno.apellido}`,
          curso: i.curso.nombre,
        });
      });
    }

    return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async getTeacherAssignmentHistory(dto: GetTeacherAssignmentHistoryDto) {
    const { fechaDesde, fechaHasta, tipoMovimiento, cursoId } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const events: any[] = [];

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoAsignacion.TODOS ||
      tipoMovimiento === TipoMovimientoAsignacion.ASIGNACION
    ) {
      const where: Prisma.DocenteCursoWhereInput = {
        fechaAsignacion: { gte: start, lte: end },
      };
      if (cursoId) where.idCurso = cursoId;

      const asignaciones = await this.prisma.docenteCurso.findMany({
        where,
        include: {
          docente: { select: { nombre: true, apellido: true } },
          curso: { select: { nombre: true } },
        },
      });
      asignaciones.forEach((i) => {
        events.push({
          tipo: 'Asignación',
          fecha: i.fechaAsignacion,
          docente: `${i.docente.nombre} ${i.docente.apellido}`,
          curso: i.curso.nombre,
        });
      });
    }

    if (
      !tipoMovimiento ||
      tipoMovimiento === TipoMovimientoAsignacion.TODOS ||
      tipoMovimiento === TipoMovimientoAsignacion.BAJA
    ) {
      const where: Prisma.DocenteCursoWhereInput = {
        fechaBaja: { gte: start, lte: end },
      };
      if (cursoId) where.idCurso = cursoId;

      const bajas = await this.prisma.docenteCurso.findMany({
        where,
        include: {
          docente: { select: { nombre: true, apellido: true } },
          curso: { select: { nombre: true } },
        },
      });
      bajas.forEach((i) => {
        events.push({
          tipo: 'Baja',
          fecha: i.fechaBaja!,
          docente: `${i.docente.nombre} ${i.docente.apellido}`,
          curso: i.curso.nombre,
        });
      });
    }

    return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  // --- REPORTES ESPECÍFICOS DE CURSO (ADMIN Y DOCENTE) ---

  async getCourseProgressSummary(
    idCurso: string,
    dto?: GetCourseProgressSummaryDto,
  ) {
    const { fechaCorte } = dto || {};

    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
      select: { id: true, idProgreso: true },
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado.');
    }

    let progreso: any;
    let totalAlumnos = 0;

    if (fechaCorte) {
      // --- MODO HISTÓRICO ---
      const end = new Date(fechaCorte);
      end.setUTCHours(23, 59, 59, 999);

      // 1. Buscar el registro histórico más cercano a la fecha de corte
      const historial = await this.prisma.historialProgresoCurso.findFirst({
        where: {
          idProgresoCurso: curso.idProgreso,
          fechaRegistro: { lte: end },
        },
        orderBy: { fechaRegistro: 'desc' },
      });

      // Si no hay historial previo, asumimos valores en 0
      progreso = historial || {
        misionesCompletadas: 0,
        totalEstrellas: 0,
        totalExp: 0,
        totalIntentos: 0,
        pctMisionesCompletadas: 0,
        promEstrellas: 0,
        promIntentos: 0,
      };

      // 2. Calcular alumnos activos a esa fecha
      totalAlumnos = await this.prisma.alumnoCurso.count({
        where: {
          idCurso: idCurso,
          fechaInscripcion: { lte: end },
          OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
        },
      });
    } else {
      // --- MODO ACTUAL ---
      progreso = await this.prisma.progresoCurso.findUnique({
        where: { id: curso.idProgreso },
      });

      if (!progreso) throw new NotFoundException('Progreso no inicializado.');

      totalAlumnos = await this.prisma.alumnoCurso.count({
        where: { idCurso: idCurso, estado: estado_simple.Activo },
      });
    }

    // Parse Decimals
    const pctCompletadas = Number(progreso.pctMisionesCompletadas);
    const promEstrellas = Number(progreso.promEstrellas);
    const promIntentos = Number(progreso.promIntentos);

    // Gráfico de Torta: Progreso Promedio vs Restante
    const pieChartData = [
      { label: 'Completado', value: pctCompletadas, color: '#4caf50' },
      { label: 'Restante', value: 100 - pctCompletadas, color: '#e0e0e0' },
    ];

    return {
      resumen: {
        progresoTotal: pctCompletadas,
        misionesCompletadas: progreso.misionesCompletadas,
        estrellasTotales: progreso.totalEstrellas,
        expTotal: progreso.totalExp,
        intentosTotales: progreso.totalIntentos,
        promEstrellas,
        promIntentos,
        totalAlumnos,
      },
      grafico: pieChartData,
    };
  }

  async getCourseMissionsReport(
    idCurso: string,
    dto: GetCourseMissionsReportDto,
  ) {
    const { dificultad, fechaDesde, fechaHasta } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const where: Prisma.MisionCompletadaWhereInput = {
      progresoAlumno: {
        alumnoCurso: { idCurso: idCurso },
      },
      fechaCompletado: { gte: start, lte: end },
    };

    if (dificultad) {
      where.mision = { dificultadMision: dificultad };
    }

    const completions = await this.prisma.misionCompletada.findMany({
      where,
      include: {
        mision: true,
        progresoAlumno: true, // Solo necesitamos el ID para contar únicos
      },
      orderBy: { fechaCompletado: 'asc' },
    });

    // 1. Agrupación por Misión
    const totalAlumnos = await this.prisma.alumnoCurso.count({
      where: { idCurso: idCurso, estado: estado_simple.Activo },
    });

    const missionStats: Record<string, any> = {};

    completions.forEach((c) => {
      if (!missionStats[c.idMision]) {
        missionStats[c.idMision] = {
          id: c.idMision,
          nombre: c.mision.nombre,
          dificultad: c.mision.dificultadMision,
          count: 0,
          uniqueStudents: new Set(),
          totalEstrellas: 0,
          totalExp: 0,
          totalIntentos: 0,
        };
      }
      const stat = missionStats[c.idMision];
      stat.count++;
      stat.uniqueStudents.add(c.idProgreso);
      stat.totalEstrellas += c.estrellas;
      stat.totalExp += c.exp;
      stat.totalIntentos += c.intentos;
    });

    const tableData = Object.values(missionStats).map((stat: any) => {
      const uniqueCount = stat.uniqueStudents.size;
      return {
        id: stat.id,
        nombre: stat.nombre,
        dificultad: stat.dificultad,
        completadoPor: uniqueCount,
        pctCompletado:
          totalAlumnos > 0 ? (uniqueCount / totalAlumnos) * 100 : 0,
        promEstrellas: stat.totalEstrellas / stat.count,
        promExp: stat.totalExp / stat.count,
        promIntentos: stat.totalIntentos / stat.count,
      };
    });

    // 2. Gráfico de tiempo (Total de misiones completadas por fecha)
    const chartData: Record<string, number> = {};
    completions.forEach((c) => {
      if (c.fechaCompletado) {
        const dateKey = c.fechaCompletado.toISOString().split('T')[0];
        chartData[dateKey] = (chartData[dateKey] || 0) + 1;
      }
    });

    const grafico = Object.entries(chartData)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

    return {
      grafico,
      tabla: tableData,
    };
  }

  async getCourseMissionDetailReport(
    idCurso: string,
    dto: GetCourseMissionDetailReportDto,
  ) {
    const { misionId, dificultad, fechaDesde, fechaHasta } = dto;

    // Si no se selecciona misión, devolvemos lista para el selector
    if (!misionId) {
      const whereMision: Prisma.MisionWhereInput = {};
      if (dificultad) whereMision.dificultadMision = dificultad;

      const misiones = await this.prisma.mision.findMany({
        where: whereMision,
        select: { id: true, nombre: true, dificultadMision: true },
      });
      return { misionesDisponibles: misiones, detalle: null };
    }

    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // Info Misión
    const mision = await this.prisma.mision.findUnique({
      where: { id: misionId },
    });
    if (!mision) throw new NotFoundException('Misión no encontrada');

    // Completions
    const completions = await this.prisma.misionCompletada.findMany({
      where: {
        idMision: misionId,
        progresoAlumno: {
          alumnoCurso: { idCurso: idCurso },
        },
        fechaCompletado: { gte: start, lte: end },
      },
      include: {
        progresoAlumno: {
          include: {
            alumnoCurso: {
              include: {
                alumno: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
      },
      orderBy: { fechaCompletado: 'desc' },
    });

    // Gráfico
    const chartData: Record<string, number> = {};
    completions.forEach((c) => {
      if (c.fechaCompletado) {
        const dateKey = c.fechaCompletado.toISOString().split('T')[0];
        chartData[dateKey] = (chartData[dateKey] || 0) + 1;
      }
    });

    // Stats
    const totalCompletions = completions.length;
    const uniqueStudents = new Set(completions.map((c) => c.idProgreso)).size;
    const totalAlumnos = await this.prisma.alumnoCurso.count({
      where: { idCurso: idCurso, estado: estado_simple.Activo },
    });

    const totalEstrellas = completions.reduce((acc, c) => acc + c.estrellas, 0);
    const totalExp = completions.reduce((acc, c) => acc + c.exp, 0);
    const totalIntentos = completions.reduce((acc, c) => acc + c.intentos, 0);

    // Tabla Alumnos
    const tableData = completions.map((c) => ({
      id: c.progresoAlumno.id,
      alumno: c.progresoAlumno.alumnoCurso
        ? `${c.progresoAlumno.alumnoCurso.alumno.nombre} ${c.progresoAlumno.alumnoCurso.alumno.apellido}`
        : 'Alumno Desconocido',
      estrellas: c.estrellas,
      exp: c.exp,
      intentos: c.intentos,
      fecha: c.fechaCompletado,
    }));

    return {
      mision: mision,
      grafico: Object.entries(chartData).map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      })),
      stats: {
        vecesCompletada: totalCompletions,
        alumnosCompletaron: uniqueStudents,
        pctAlumnos:
          totalAlumnos > 0 ? (uniqueStudents / totalAlumnos) * 100 : 0,
        promEstrellas:
          totalCompletions > 0 ? totalEstrellas / totalCompletions : 0,
        promExp: totalCompletions > 0 ? totalExp / totalCompletions : 0,
        promIntentos:
          totalCompletions > 0 ? totalIntentos / totalCompletions : 0,
      },
      tabla: tableData,
    };
  }

  async getCourseDifficultiesReport(
    idCurso: string,
    dto: GetCourseDifficultiesReportDto,
  ) {
    const { fechaCorte } = dto;

    // 1. Obtener Total de Alumnos (Activos a la fecha)
    let totalAlumnos = 0;
    let rawDifficulties: any[] = [];

    if (fechaCorte) {
      const end = new Date(fechaCorte);
      end.setUTCHours(23, 59, 59, 999);

      // A. Alumnos activos a la fecha de corte
      totalAlumnos = await this.prisma.alumnoCurso.count({
        where: {
          idCurso: idCurso,
          fechaInscripcion: { lte: end },
          OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
        },
      });

      // B. Reconstruir estado de dificultades desde el historial
      const history = await this.prisma.historialDificultadAlumno.findMany({
        where: {
          idCurso: idCurso,
          fechaCambio: { lte: end },
        },
        orderBy: { fechaCambio: 'asc' }, // Procesamos en orden cronológico
        include: { dificultad: true },
      });

      // Mapa para guardar el último estado: "idAlumno-idDificultad" -> Registro
      const stateMap = new Map<string, any>();

      history.forEach((h) => {
        const key = `${h.idAlumno}-${h.idDificultad}`;
        stateMap.set(key, {
          idAlumno: h.idAlumno,
          idDificultad: h.idDificultad,
          grado: h.gradoNuevo, // Leemos 'gradoNuevo' del historial, pero lo guardamos como 'grado' para la lógica siguiente
          dificultad: h.dificultad,
        });
      });

      rawDifficulties = Array.from(stateMap.values());
    } else {
      // MODO ACTUAL
      totalAlumnos = await this.prisma.alumnoCurso.count({
        where: { idCurso: idCurso, estado: estado_simple.Activo },
      });

      rawDifficulties = await this.prisma.dificultadAlumno.findMany({
        where: { idCurso: idCurso },
        include: { dificultad: true },
      });
    }

    // Filtramos las que tengan grado 'Ninguno' si consideramos que eso significa "sin dificultad"
    // Opcional: Depende de tu lógica de negocio. Asumiremos que 'Ninguno' no cuenta como dificultad activa.
    const activeDifficulties = rawDifficulties.filter(
      (d) => d.grado !== grado_dificultad.Ninguno,
    );

    // --- PROCESAMIENTO DE DATOS ---

    // Estructuras auxiliares
    const byTopic = new Map<string, Set<string>>(); // Tema -> Set(idAlumnos)
    const byDifficulty = new Map<string, Set<string>>(); // IdDificultad -> Set(idAlumnos)
    const byGrade = { Bajo: 0, Medio: 0, Alto: 0 };
    const difficultyDetails = new Map<string, any>(); // IdDificultad -> Stats
    const studentsWithHighGrade = new Set<string>();
    const highGradeDifficultiesCount = new Map<string, number>(); // IdDificultad -> Count (solo grado Alto)

    activeDifficulties.forEach((d) => {
      // 1. Por Tema
      const tema = d.dificultad.tema;
      if (!byTopic.has(tema)) byTopic.set(tema, new Set());
      byTopic.get(tema)!.add(d.idAlumno);

      // 2. Por Dificultad
      const difId = d.idDificultad;
      if (!byDifficulty.has(difId)) byDifficulty.set(difId, new Set());
      byDifficulty.get(difId)!.add(d.idAlumno);

      // 4. Detalle por Dificultad (Tabla)
      if (!difficultyDetails.has(difId)) {
        difficultyDetails.set(difId, {
          id: difId,
          nombre: d.dificultad.nombre,
          tema: d.dificultad.tema,
          total: 0,
          grados: { Bajo: 0, Medio: 0, Alto: 0 },
        });
      }
      const detail = difficultyDetails.get(difId)!;
      detail.total++;
      if (d.grado in detail.grados) detail.grados[d.grado]++;

      // 3. Por Grado
      if (d.grado in byGrade) {
        byGrade[d.grado]++;
      }

      // 5. Stats de Grado Alto
      if (d.grado === grado_dificultad.Alto) {
        studentsWithHighGrade.add(d.idAlumno);
        highGradeDifficultiesCount.set(
          d.idDificultad,
          (highGradeDifficultiesCount.get(d.idDificultad) || 0) + 1,
        );
      }
    });

    // --- CONSTRUCCIÓN DE RESPUESTA ---

    // Gráficos
    const graficoTemas = Array.from(byTopic.entries()).map(
      ([tema, students]) => ({
        label: tema,
        value: students.size,
      }),
    );

    const graficoDificultades = Array.from(byDifficulty.entries()).map(
      ([id, students]) => ({
        label: difficultyDetails.get(id)?.nombre || 'Desconocida',
        value: students.size,
      }),
    );

    const graficoGrados = [
      { label: 'Bajo', value: byGrade.Bajo, color: '#4caf50' },
      { label: 'Medio', value: byGrade.Medio, color: '#ff9800' },
      { label: 'Alto', value: byGrade.Alto, color: '#f44336' },
    ];

    // Distribución de Grados (Datos para el gráfico)
    const distribucionGrados = Array.from(difficultyDetails.values());

    // KPIs
    const totalActiveDifficulties = activeDifficulties.length;
    const promDificultades =
      totalAlumnos > 0 ? totalActiveDifficulties / totalAlumnos : 0;

    // Moda Tema
    let maxTopic = { label: 'Ninguno', value: 0 };
    graficoTemas.forEach((t) => {
      if (t.value > maxTopic.value) maxTopic = t;
    });
    const pctTemaFrecuente =
      totalAlumnos > 0 ? (maxTopic.value / totalAlumnos) * 100 : 0;

    // Moda Dificultad
    let maxDiff = { label: 'Ninguna', value: 0, id: '' };
    graficoDificultades.forEach((d, idx) => {
      const id = Array.from(byDifficulty.keys())[idx]; // Orden coincide
      if (d.value > maxDiff.value) maxDiff = { ...d, id };
    });
    const pctDificultadFrecuente =
      totalAlumnos > 0 ? (maxDiff.value / totalAlumnos) * 100 : 0;
    const breakdownDificultadFrecuente = maxDiff.id
      ? difficultyDetails.get(maxDiff.id)?.grados
      : null;

    // Grado Alto
    const pctGradoAlto =
      totalAlumnos > 0 ? (studentsWithHighGrade.size / totalAlumnos) * 100 : 0;

    let maxHighDiffId = '';
    let maxHighDiffCount = 0;
    highGradeDifficultiesCount.forEach((count, id) => {
      if (count > maxHighDiffCount) {
        maxHighDiffCount = count;
        maxHighDiffId = id;
      }
    });
    const nombreModaAlto = maxHighDiffId
      ? difficultyDetails.get(maxHighDiffId)?.nombre
      : 'Ninguna';

    return {
      graficos: {
        porTema: graficoTemas,
        porDificultad: graficoDificultades,
        porGrado: graficoGrados,
      },
      distribucionGrados,
      kpis: {
        totalAlumnos,
        promDificultades,
        temaFrecuente: {
          nombre: maxTopic.label,
          pctAlumnos: pctTemaFrecuente,
        },
        dificultadFrecuente: {
          nombre: maxDiff.label,
          pctAlumnos: pctDificultadFrecuente,
          desglose: breakdownDificultadFrecuente,
        },
        gradoAlto: {
          pctAlumnos: pctGradoAlto,
          modaNombre: nombreModaAlto,
        },
      },
    };
  }

  async getCourseDifficultiesHistory(
    idCurso: string,
    dto: GetCourseDifficultiesHistoryDto,
  ) {
    const {
      temas: temasStr,
      dificultades,
      fuente,
      fechaDesde,
      fechaHasta,
    } = dto;

    // 1. Configurar rango de fechas
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // 2. Construir filtro WHERE
    const where: Prisma.HistorialDificultadAlumnoWhereInput = {
      idCurso,
      fechaCambio: { gte: start, lte: end },
    };

    if (fuente) {
      where.fuente = fuente;
    }

    if (dificultades) {
      const ids = dificultades.split(',').filter(Boolean);
      if (ids.length > 0) where.idDificultad = { in: ids };
    }

    if (temasStr) {
      const temasList = temasStr.split(',').filter(Boolean) as temas[];
      if (temasList.length > 0) {
        where.dificultad = { tema: { in: temasList } };
      }
    }

    // 3. Consultar Historial
    const history = await this.prisma.historialDificultadAlumno.findMany({
      where,
      include: {
        alumno: { select: { nombre: true, apellido: true } },
        dificultad: { select: { nombre: true, tema: true } },
      },
      orderBy: { fechaCambio: 'desc' },
    });

    // 4. Procesar Datos

    // A) Línea de Tiempo (Agrupado por día y fuente)
    const timelineMap = new Map<
      string,
      { videojuego: number; sesion_refuerzo: number }
    >();

    // B) Estadísticas de Mejora
    let totalMejoras = 0;
    let mejorasVideojuego = 0;
    let mejorasSesion = 0;

    // Pesos para comparar grados: Alto(3) > Medio(2) > Bajo(1) > Ninguno(0)
    const gradeWeight: Record<string, number> = {
      [grado_dificultad.Ninguno]: 0,
      [grado_dificultad.Bajo]: 1,
      [grado_dificultad.Medio]: 2,
      [grado_dificultad.Alto]: 3,
    };

    history.forEach((h) => {
      // Timeline
      const dateKey = h.fechaCambio.toISOString().split('T')[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { videojuego: 0, sesion_refuerzo: 0 });
      }
      const entry = timelineMap.get(dateKey)!;

      if (h.fuente === fuente_cambio_dificultad.VIDEOJUEGO) entry.videojuego++;
      else if (h.fuente === fuente_cambio_dificultad.SESION_REFUERZO)
        entry.sesion_refuerzo++;

      // Stats: Mejora si el grado anterior era "mayor" (más difícil) que el nuevo
      const wOld = gradeWeight[h.gradoAnterior] || 0;
      const wNew = gradeWeight[h.gradoNuevo] || 0; // Usamos gradoNuevo

      if (wOld > wNew) {
        totalMejoras++;
        if (h.fuente === fuente_cambio_dificultad.VIDEOJUEGO)
          mejorasVideojuego++;
        else if (h.fuente === fuente_cambio_dificultad.SESION_REFUERZO)
          mejorasSesion++;
      }
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([fecha, counts]) => ({
        fecha,
        videojuego: counts.videojuego,
        sesion_refuerzo: counts.sesion_refuerzo,
      }))
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

    const stats = {
      totalMejoras,
      porcentajeVideojuego:
        totalMejoras > 0 ? (mejorasVideojuego / totalMejoras) * 100 : 0,
      porcentajeSesion:
        totalMejoras > 0 ? (mejorasSesion / totalMejoras) * 100 : 0,
    };

    return { timeline, stats, tabla: history };
  }

  async getStudentDifficultiesReport(
    idCurso: string,
    dto: GetStudentDifficultiesReportDto,
  ) {
    const {
      studentId,
      temas: temasStr,
      dificultades,
      fuente,
      fechaDesde,
      fechaHasta,
    } = dto;

    // --- PARTE 1: MINI RESUMEN (Estado Actual) ---
    // Obtenemos las dificultades actuales del alumno en este curso
    const currentDifficulties = await this.prisma.dificultadAlumno.findMany({
      where: {
        idCurso,
        idAlumno: studentId,
        grado: { not: grado_dificultad.Ninguno }, // Solo activas
      },
      include: { dificultad: true },
    });

    // Agrupaciones para gráficos del resumen
    const byGrade = { Bajo: 0, Medio: 0, Alto: 0 };
    const byTopic: Record<string, number> = {};

    currentDifficulties.forEach((d) => {
      if (d.grado in byGrade) byGrade[d.grado]++;
      byTopic[d.dificultad.tema] = (byTopic[d.dificultad.tema] || 0) + 1;
    });

    const summary = {
      tabla: currentDifficulties.map((d) => ({
        id: d.dificultad.id,
        nombre: d.dificultad.nombre,
        tema: d.dificultad.tema,
        grado: d.grado,
      })),
      graficos: {
        porGrado: [
          { label: 'Bajo', value: byGrade.Bajo, color: '#4caf50' },
          { label: 'Medio', value: byGrade.Medio, color: '#ff9800' },
          { label: 'Alto', value: byGrade.Alto, color: '#f44336' },
        ],
        porTema: Object.entries(byTopic).map(([label, value]) => ({
          label,
          value,
        })),
      },
    };

    // --- PARTE 2: HISTORIAL Y EVOLUCIÓN ---

    // Filtros de fecha
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const whereHistory: Prisma.HistorialDificultadAlumnoWhereInput = {
      idCurso,
      idAlumno: studentId,
      fechaCambio: { gte: start, lte: end },
    };

    if (fuente) whereHistory.fuente = fuente;
    if (dificultades) {
      const ids = dificultades.split(',').filter(Boolean);
      if (ids.length > 0) whereHistory.idDificultad = { in: ids };
    }
    if (temasStr) {
      const temasList = temasStr.split(',').filter(Boolean) as temas[];
      if (temasList.length > 0)
        whereHistory.dificultad = { tema: { in: temasList } };
    }

    const history = await this.prisma.historialDificultadAlumno.findMany({
      where: whereHistory,
      include: { dificultad: { select: { nombre: true, tema: true } } },
      orderBy: { fechaCambio: 'asc' }, // Orden ascendente para construir la evolución
    });

    // A) Stats de Mejora
    let totalMejoras = 0;
    let mejorasVideojuego = 0;
    let mejorasSesion = 0;
    const gradeWeight: Record<string, number> = {
      [grado_dificultad.Ninguno]: 0,
      [grado_dificultad.Bajo]: 1,
      [grado_dificultad.Medio]: 2,
      [grado_dificultad.Alto]: 3,
    };

    history.forEach((h) => {
      const wOld = gradeWeight[h.gradoAnterior] || 0;
      const wNew = gradeWeight[h.gradoNuevo] || 0;
      if (wOld > wNew) {
        totalMejoras++;
        if (h.fuente === fuente_cambio_dificultad.VIDEOJUEGO)
          mejorasVideojuego++;
        else if (h.fuente === fuente_cambio_dificultad.SESION_REFUERZO)
          mejorasSesion++;
      }
    });

    const stats = {
      totalMejoras,
      porcentajeVideojuego:
        totalMejoras > 0 ? (mejorasVideojuego / totalMejoras) * 100 : 0,
      porcentajeSesion:
        totalMejoras > 0 ? (mejorasSesion / totalMejoras) * 100 : 0,
    };

    // B) Gráfico de Evolución (Dataset unificado)
    // Necesitamos un punto en el tiempo por cada cambio, manteniendo el estado de las otras dificultades.
    const evolutionDataset: any[] = [];
    const currentStates: Record<string, number> = {}; // idDificultad -> valor numérico
    const difficultyNames: Record<string, string> = {}; // idDificultad -> Nombre

    // Inicializamos el dataset
    history.forEach((h) => {
      const dateStr = h.fechaCambio.toISOString();
      const diffId = h.idDificultad;
      const newVal = gradeWeight[h.gradoNuevo];
      const oldVal = gradeWeight[h.gradoAnterior];

      // Si es la primera vez que vemos esta dificultad en la línea de tiempo,
      // insertamos un punto "previo" con el valor anterior (ej. Ninguno)
      // para que el gráfico dibuje la línea de transición hacia el nuevo valor.
      if (currentStates[diffId] === undefined) {
        // Usamos 1 segundo antes para crear el efecto de "salto" o transición
        let prevDate = new Date(h.fechaCambio.getTime() - 1000);

        // Aseguramos no romper el orden cronológico si hay eventos muy pegados
        if (evolutionDataset.length > 0) {
          const lastDate = evolutionDataset[evolutionDataset.length - 1].date;
          if (prevDate < lastDate) prevDate = lastDate;
        }

        evolutionDataset.push({
          date: prevDate,
          ...currentStates, // Estado de las otras dificultades en ese momento
          [diffId]: oldVal, // Forzamos el valor anterior para esta dificultad
        });
      }

      currentStates[diffId] = newVal;
      difficultyNames[diffId] = h.dificultad.nombre;

      // Creamos un punto en el tiempo con el estado actual de TODAS las dificultades rastreadas hasta ese momento
      const dataPoint: any = {
        date: h.fechaCambio, // Objeto Date para el eje X
        ...currentStates, // Spread de los estados actuales
      };
      evolutionDataset.push(dataPoint);
    });

    // Lista de series para el gráfico (una por dificultad encontrada en el historial)
    const series = Object.keys(difficultyNames).map((id) => ({
      dataKey: id,
      label: difficultyNames[id],
      showMark: true,
    }));

    return {
      summary,
      history: history.reverse(), // Devolvemos historial descendente para la tabla
      stats,
      evolution: {
        dataset: evolutionDataset,
        series,
      },
    };
  }

  async getCourseConsultationsSummary(
    idCurso: string,
    dto: GetCourseConsultationsSummaryDto,
  ) {
    const { fechaDesde, fechaHasta } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // 1. Obtener todas las consultas en el rango (incluyendo eliminadas para el conteo de inactivas)
    const allConsultations = await this.prisma.consulta.findMany({
      where: {
        idCurso,
        fechaConsulta: { gte: start, lte: end },
      },
      include: {
        alumno: { select: { id: true, nombre: true, apellido: true } },
        respuestaConsulta: { include: { docente: true } },
        clasesDondeSeTrata: {
          include: {
            claseConsulta: { include: { docenteResponsable: true } },
          },
        },
      },
    });

    // 2. Separar Activas e Inactivas
    let activeCount = 0;
    let inactiveCount = 0;
    const activeConsultations: any[] = [];

    allConsultations.forEach((c) => {
      if (c.deletedAt) {
        inactiveCount++;
      } else {
        activeCount++;
        activeConsultations.push(c);
      }
    });

    // 3. Gráfico de Torta (Solo Activas)
    const statusCounts = {
      [estado_consulta.Pendiente]: 0,
      [estado_consulta.A_revisar]: 0,
      [estado_consulta.Revisada]: 0,
      [estado_consulta.Resuelta]: 0,
    };

    activeConsultations.forEach((c) => {
      if (statusCounts[c.estado] !== undefined) {
        statusCounts[c.estado]++;
      }
    });

    const graficoEstados = [
      {
        label: 'Pendiente',
        value: statusCounts[estado_consulta.Pendiente],
        color: '#ff9800',
      }, // Naranja
      {
        label: 'A revisar',
        value: statusCounts[estado_consulta.A_revisar],
        color: '#2196f3',
      }, // Azul
      {
        label: 'Revisada',
        value: statusCounts[estado_consulta.Revisada],
        color: '#9c27b0',
      }, // Violeta
      {
        label: 'Resuelta',
        value: statusCounts[estado_consulta.Resuelta],
        color: '#4caf50',
      }, // Verde
    ];

    // 4. Estadísticas

    // A. Alumno con más consultas
    const studentCounts = new Map<string, { count: number; name: string }>();
    activeConsultations.forEach((c) => {
      const id = c.idAlumno;
      const name = `${c.alumno.nombre} ${c.alumno.apellido}`;
      if (!studentCounts.has(id)) studentCounts.set(id, { count: 0, name });
      studentCounts.get(id)!.count++;
    });

    let topStudent = { name: 'Ninguno', count: 0, percentage: 0 };
    for (const [_, data] of studentCounts) {
      if (data.count > topStudent.count) {
        topStudent = {
          name: data.name,
          count: data.count,
          percentage: activeCount > 0 ? (data.count / activeCount) * 100 : 0,
        };
      }
    }

    // B. Docente que más responde/atiende
    // Contamos "intervenciones" únicas: Si respondió o si fue el responsable de la clase donde se trató.
    const teacherCounts = new Map<
      string,
      { count: number; name: string; consultations: Set<string> }
    >();

    activeConsultations.forEach((c) => {
      // 1. Respuesta directa
      if (c.respuestaConsulta?.docente) {
        const d = c.respuestaConsulta.docente;
        const id = d.id;
        const name = `${d.nombre} ${d.apellido}`;
        if (!teacherCounts.has(id))
          teacherCounts.set(id, { count: 0, name, consultations: new Set() });
        teacherCounts.get(id)!.consultations.add(c.id);
      }

      // 2. Tratada en clase
      c.clasesDondeSeTrata.forEach((cc: any) => {
        if (cc.claseConsulta?.docenteResponsable) {
          const d = cc.claseConsulta.docenteResponsable;
          const id = d.id;
          const name = `${d.nombre} ${d.apellido}`;
          if (!teacherCounts.has(id))
            teacherCounts.set(id, { count: 0, name, consultations: new Set() });
          teacherCounts.get(id)!.consultations.add(c.id);
        }
      });
    });

    let topTeacher = { name: 'Ninguno', count: 0, percentage: 0 };
    for (const [_, data] of teacherCounts) {
      const count = data.consultations.size;
      if (count > topTeacher.count) {
        topTeacher = {
          name: data.name,
          count: count,
          percentage: activeCount > 0 ? (count / activeCount) * 100 : 0,
        };
      }
    }

    // C. Porcentaje Resueltas
    const resolvedCount = statusCounts[estado_consulta.Resuelta];
    const resolvedPct =
      activeCount > 0 ? (resolvedCount / activeCount) * 100 : 0;

    // D. Porcentaje Por Atender (Pendiente + A revisar)
    const pendingCount =
      statusCounts[estado_consulta.Pendiente] +
      statusCounts[estado_consulta.A_revisar];
    const pendingPct = activeCount > 0 ? (pendingCount / activeCount) * 100 : 0;

    // E. Métricas de Impacto de Clases de Consulta
    let reviewedInClassCount = 0;
    let resolvedInClassCount = 0;

    activeConsultations.forEach((c) => {
      // Verificamos si fue revisada en alguna clase
      const wasReviewedInClass = c.clasesDondeSeTrata.some(
        (cc) => cc.revisadaEnClase,
      );

      if (wasReviewedInClass) {
        reviewedInClassCount++;
        // Si fue revisada en clase Y está resuelta, cuenta como éxito de la clase
        if (c.estado === estado_consulta.Resuelta) {
          resolvedInClassCount++;
        }
      }
    });

    const reviewedInClassPct =
      activeCount > 0 ? (reviewedInClassCount / activeCount) * 100 : 0;
    const resolvedInClassPct =
      activeCount > 0 ? (resolvedInClassCount / activeCount) * 100 : 0;

    return {
      kpis: {
        totalConsultas: activeCount + inactiveCount,
        activas: activeCount,
        inactivas: inactiveCount,
        resueltas: { count: resolvedCount, percentage: resolvedPct },
        pendientes: { count: pendingCount, percentage: pendingPct },
        impactoClases: {
          revisadas: {
            count: reviewedInClassCount,
            percentage: reviewedInClassPct,
          },
          resueltas: {
            count: resolvedInClassCount,
            percentage: resolvedInClassPct,
          },
        },
      },
      graficoEstados,
      topStudent,
      topTeacher,
    };
  }

  async getCourseConsultationsHistory(
    idCurso: string,
    dto: GetCourseConsultationsHistoryDto,
  ) {
    const { temas: temasStr, estados, alumnos, fechaDesde, fechaHasta } = dto;

    // 1. Configurar Fechas
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // 2. Construir Filtros
    const where: Prisma.ConsultaWhereInput = {
      idCurso,
      fechaConsulta: { gte: start, lte: end },
      deletedAt: null, // Solo consultas activas para el historial operativo
    };

    if (temasStr) {
      const list = temasStr.split(',').filter(Boolean) as temas[];
      if (list.length > 0) where.tema = { in: list };
    }

    if (estados) {
      const list = estados.split(',').filter(Boolean) as estado_consulta[];
      if (list.length > 0) where.estado = { in: list };
    }

    if (alumnos) {
      const list = alumnos.split(',').filter(Boolean);
      if (list.length > 0) where.idAlumno = { in: list };
    }

    // 3. Consultar Datos
    const consultas = await this.prisma.consulta.findMany({
      where,
      include: {
        alumno: { select: { nombre: true, apellido: true } },
        respuestaConsulta: {
          include: { docente: { select: { nombre: true, apellido: true } } },
        },
        clasesDondeSeTrata: {
          include: {
            claseConsulta: {
              include: {
                docenteResponsable: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        },
      },
      orderBy: { fechaConsulta: 'desc' },
    });

    // 4. Procesar Datos para Tabla y Timeline
    const timelineMap = new Map<string, number>();
    const tabla = consultas.map((c) => {
      // Timeline
      const dateKey = c.fechaConsulta.toISOString().split('T')[0];
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);

      // Determinar docente responsable (Respuesta directa o Clase)
      let docente = '-';
      if (c.respuestaConsulta?.docente) {
        docente = `${c.respuestaConsulta.docente.nombre} ${c.respuestaConsulta.docente.apellido}`;
      } else if (c.clasesDondeSeTrata.length > 0) {
        // Tomamos el docente de la última clase donde se trató
        const lastClass = c.clasesDondeSeTrata[c.clasesDondeSeTrata.length - 1];
        if (lastClass.claseConsulta?.docenteResponsable) {
          docente = `${lastClass.claseConsulta.docenteResponsable.nombre} ${lastClass.claseConsulta.docenteResponsable.apellido}`;
        }
      }

      return {
        id: c.id,
        titulo: c.titulo,
        tema: c.tema,
        fecha: c.fechaConsulta,
        alumno: `${c.alumno.nombre} ${c.alumno.apellido}`,
        estado: c.estado,
        docente,
        valoracion: c.valoracionAlumno,
        respuesta: c.respuestaConsulta?.descripcion || null,
      };
    });

    // 5. Calcular Estadísticas
    const totalConsultas = consultas.length;

    // Calcular diferencia de días real entre el rango seleccionado (o el rango de datos si no se seleccionó)
    const effectiveStart = fechaDesde
      ? start
      : consultas.length > 0
        ? consultas[consultas.length - 1].fechaConsulta
        : new Date();
    const effectiveEnd = fechaHasta ? end : new Date();

    const diffTime = Math.abs(
      effectiveEnd.getTime() - effectiveStart.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Mínimo 1 día para evitar división por 0
    const diffWeeks = Math.max(diffDays / 7, 1);

    const stats = {
      total: totalConsultas,
      promedioDiario: totalConsultas / diffDays,
      promedioSemanal: totalConsultas / diffWeeks,
    };

    const timeline = Array.from(timelineMap.entries())
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

    return { stats, timeline, tabla };
  }

  async getCourseClassesSummary(
    idCurso: string,
    dto: GetCourseClassesSummaryDto,
  ) {
    const { fechaDesde, fechaHasta } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // 1. Obtener Clases
    const allClasses = await this.prisma.claseConsulta.findMany({
      where: {
        idCurso,
        fechaClase: { gte: start, lte: end },
      },
      include: {
        docenteResponsable: {
          select: { id: true, nombre: true, apellido: true },
        },
        consultasEnClase: true,
      },
    });

    // 2. Clasificación Activas/Inactivas y Gráfico
    let activeCount = 0;
    let inactiveCount = 0;
    const activeClasses: any[] = [];
    const realizedClasses: any[] = [];
    const statusCounts: Record<string, number> = {};

    allClasses.forEach((c) => {
      const estado = c.estadoClase;
      statusCounts[estado] = (statusCounts[estado] || 0) + 1;

      const isInactive =
        c.deletedAt !== null ||
        c.estadoClase === estado_clase_consulta.Cancelada ||
        c.estadoClase === estado_clase_consulta.No_realizada;

      if (isInactive) {
        inactiveCount++;
      } else {
        activeCount++;
        activeClasses.push(c);
      }

      if (c.estadoClase === estado_clase_consulta.Realizada) {
        realizedClasses.push(c);
      }
    });

    const graficoEstados = Object.entries(statusCounts).map(
      ([label, value]) => ({
        label: label.replace('_', ' '),
        value,
      }),
    );

    // 3. Promedio de consultas por clase (Sobre clases activas)
    let totalConsultasAgendadas = 0;
    activeClasses.forEach((c) => {
      totalConsultasAgendadas += c.consultasEnClase.length;
    });
    const promConsultasPorClase =
      activeCount > 0 ? totalConsultasAgendadas / activeCount : 0;

    // 4. Efectividad de Revisión (Sobre clases REALIZADAS)
    let sumPercentages = 0;
    let sumReviewedCounts = 0;
    let totalRealizedWithConsultations = 0;

    realizedClasses.forEach((c) => {
      const total = c.consultasEnClase.length;
      if (total > 0) {
        const reviewed = c.consultasEnClase.filter(
          (cc) => cc.revisadaEnClase,
        ).length;
        const pct = (reviewed / total) * 100;

        sumPercentages += pct;
        sumReviewedCounts += reviewed;
        totalRealizedWithConsultations++;
      }
    });

    const promPorcentajeRevisadas =
      totalRealizedWithConsultations > 0
        ? sumPercentages / totalRealizedWithConsultations
        : 0;

    const promCantidadRevisadas =
      totalRealizedWithConsultations > 0
        ? sumReviewedCounts / totalRealizedWithConsultations
        : 0;

    // 5. Impacto en Resolución (Consultas Resueltas vs Resueltas vía Clase)
    const resolvedConsultations = await this.prisma.consulta.findMany({
      where: {
        idCurso,
        estado: estado_consulta.Resuelta,
        fechaConsulta: { gte: start, lte: end },
      },
      include: {
        clasesDondeSeTrata: true,
      },
    });

    const totalResolved = resolvedConsultations.length;
    let resolvedViaClassCount = 0;

    resolvedConsultations.forEach((c) => {
      const wasReviewedInClass = c.clasesDondeSeTrata.some(
        (cc) => cc.revisadaEnClase,
      );
      if (wasReviewedInClass) {
        resolvedViaClassCount++;
      }
    });

    const pctResolvedViaClass =
      totalResolved > 0 ? (resolvedViaClassCount / totalResolved) * 100 : 0;

    // 6. Docente con más clases realizadas
    const teacherCounts = new Map<string, { count: number; name: string }>();
    realizedClasses.forEach((c) => {
      if (c.docenteResponsable) {
        const id = c.docenteResponsable.id;
        const name = `${c.docenteResponsable.nombre} ${c.docenteResponsable.apellido}`;
        if (!teacherCounts.has(id)) teacherCounts.set(id, { count: 0, name });
        teacherCounts.get(id)!.count++;
      }
    });

    let topTeacher = { name: 'Ninguno', count: 0 };
    for (const [_, data] of teacherCounts) {
      if (data.count > topTeacher.count) {
        topTeacher = data;
      }
    }

    return {
      kpis: {
        totalClases: allClasses.length,
        activas: activeCount,
        inactivas: inactiveCount,
        promConsultasPorClase,
      },
      graficoEstados,
      efectividad: {
        promedioRevisadasPct: promPorcentajeRevisadas,
        promedioRevisadasCount: promCantidadRevisadas,
      },
      impacto: {
        totalResueltas: totalResolved,
        resueltasViaClase: resolvedViaClassCount,
        porcentaje: pctResolvedViaClass,
      },
      topTeacher,
    };
  }

  async getCourseClassesHistory(
    idCurso: string,
    dto: GetCourseClassesHistoryDto,
  ) {
    const { fechaDesde, fechaHasta, docenteId } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    const where: Prisma.ClaseConsultaWhereInput = {
      idCurso,
      fechaClase: { gte: start, lte: end },
    };

    if (docenteId) {
      where.idDocente = docenteId;
    }

    const clases = await this.prisma.claseConsulta.findMany({
      where,
      include: {
        docenteResponsable: {
          select: { id: true, nombre: true, apellido: true },
        },
        consultasEnClase: {
          include: {
            consulta: {
              include: {
                alumno: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
      },
      orderBy: { fechaClase: 'desc' },
    });

    // Obtener lista de docentes del curso para el filtro del frontend
    const docentesCurso = await this.prisma.docenteCurso.findMany({
      where: { idCurso },
      select: {
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    // Procesamiento para Gráfico y Tabla
    const chartData: any[] = [];
    const tableData = clases.map((c) => {
      const totalConsultas = c.consultasEnClase.length;
      const revisadas = c.consultasEnClase.filter(
        (cc) => cc.revisadaEnClase,
      ).length;
      const noRevisadas = totalConsultas - revisadas;

      // Solo agregamos al gráfico si la clase tiene consultas y (opcionalmente) si está realizada
      // Para mostrar historial completo, podemos incluir todas, pero visualmente es mejor las realizadas.
      if (c.estadoClase === estado_clase_consulta.Realizada) {
        chartData.push({
          fecha: c.fechaClase.toISOString().split('T')[0],
          nombre: c.nombre,
          revisadas,
          noRevisadas,
          total: totalConsultas,
          pctRevisadas:
            totalConsultas > 0 ? (revisadas / totalConsultas) * 100 : 0,
        });
      }

      // Lógica para fecha de realización
      const fechaRealizacion =
        c.estadoClase === estado_clase_consulta.Realizada ? c.updatedAt : null;

      return {
        id: c.id,
        nombre: c.nombre,
        docenteId: c.docenteResponsable?.id || null,
        docente: c.docenteResponsable
          ? `${c.docenteResponsable.nombre} ${c.docenteResponsable.apellido}`
          : 'Sin asignar',
        fechaAgenda: c.fechaClase,
        fechaRealizacion,
        estado: c.estadoClase,
        totalConsultas,
        revisadas,
        consultasEnClase: c.consultasEnClase, // Para el modal de detalle
      };
    });

    const docentesDisponibles = docentesCurso.map((d) => ({
      id: d.docente.id,
      nombre: `${d.docente.nombre} ${d.docente.apellido}`,
    }));

    // Reverse chartData para orden cronológico (de antiguo a nuevo)
    return { chartData: chartData.reverse(), tableData, docentesDisponibles };
  }

  async getCourseSessionsSummary(
    idCurso: string,
    dto: GetCourseSessionsSummaryDto,
  ) {
    const { fechaDesde, fechaHasta } = dto;
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) start.setUTCHours(0, 0, 0, 0);
    const end = fechaHasta ? new Date(fechaHasta) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // 1. Obtener Sesiones
    const sessions = await this.prisma.sesionRefuerzo.findMany({
      where: {
        idCurso,
        createdAt: { gte: start, lte: end },
      },
      include: {
        alumno: { select: { id: true, nombre: true, apellido: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
        dificultad: { select: { id: true, nombre: true, tema: true } },
        resultadoSesion: true,
      },
    });

    // 2. Procesamiento de Datos
    let activeCount = 0;
    let inactiveCount = 0;

    const stateCounts = {
      Pendiente: 0,
      En_curso: 0,
      Completada: 0,
      No_completada: 0,
    };

    const studentCounts = new Map<string, { count: number; name: string }>();
    const teacherCounts = new Map<string, { count: number; name: string }>();
    const difficultyCounts = new Map<string, { count: number; name: string }>();
    const topicCounts = new Map<string, number>();

    let systemGeneratedCount = 0;
    let teacherGeneratedCount = 0;

    // Efectividad: [Total, Nivel1(40-60), Nivel2(60-85), Nivel3(85+)]
    const effectiveness = {
      sistema: { total: 0, level1: 0, level2: 0, level3: 0 },
      docente: { total: 0, level1: 0, level2: 0, level3: 0 },
    };

    sessions.forEach((s) => {
      // A. Activas vs Inactivas
      const isInactive =
        s.deletedAt !== null || s.estado === estado_sesion.Cancelada;
      if (isInactive) inactiveCount++;
      else activeCount++;

      // B. Estados (Lógica visual)
      if (s.estado === estado_sesion.Completada) stateCounts.Completada++;
      else if (
        s.estado === estado_sesion.Incompleta ||
        s.estado === estado_sesion.No_realizada
      )
        stateCounts.No_completada++;
      else if (s.estado === estado_sesion.Pendiente) {
        if (s.fechaInicioReal) stateCounts.En_curso++;
        else stateCounts.Pendiente++;
      }

      // C. Agrupaciones (Usamos todas las sesiones para historial de asignación)
      // Alumno
      const sId = s.idAlumno;
      if (!studentCounts.has(sId))
        studentCounts.set(sId, {
          count: 0,
          name: `${s.alumno.nombre} ${s.alumno.apellido}`,
        });
      studentCounts.get(sId)!.count++;

      // Docente vs Sistema
      if (s.idDocente) {
        teacherGeneratedCount++;
        const tId = s.idDocente;
        if (!teacherCounts.has(tId))
          teacherCounts.set(tId, {
            count: 0,
            name: `${s.docente!.nombre} ${s.docente!.apellido}`,
          });
        teacherCounts.get(tId)!.count++;
      } else {
        systemGeneratedCount++;
      }

      // Dificultad y Tema
      const dId = s.idDificultad;
      if (!difficultyCounts.has(dId))
        difficultyCounts.set(dId, { count: 0, name: s.dificultad.nombre });
      difficultyCounts.get(dId)!.count++;

      const topic = s.dificultad.tema;
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);

      // D. Efectividad (Solo completadas)
      if (s.estado === estado_sesion.Completada && s.resultadoSesion) {
        const pct = Number(s.resultadoSesion.pctAciertos);
        const target = s.idDocente
          ? effectiveness.docente
          : effectiveness.sistema;

        target.total++;
        if (pct >= 85) target.level3++;
        else if (pct >= 60) target.level2++;
        else if (pct >= 40) target.level1++;
      }
    });

    // 3. Calcular Tops y Modas
    const getTop = (map: Map<string, { count: number; name: string }>) => {
      let top = { name: 'Ninguno', count: 0 };
      for (const val of map.values()) {
        if (val.count > top.count) top = val;
      }
      return top;
    };

    const getModa = (map: Map<string, number>) => {
      let top = { label: 'Ninguno', value: 0 };
      for (const [label, value] of map.entries()) {
        if (value > top.value) top = { label, value };
      }
      return top;
    };

    const totalSessions = sessions.length;

    return {
      kpis: {
        total: totalSessions,
        activas: activeCount,
        inactivas: inactiveCount,
        estados: stateCounts,
        origen: {
          sistema: systemGeneratedCount,
          docente: teacherGeneratedCount,
        },
      },
      tops: {
        alumno: getTop(studentCounts),
        docente: getTop(teacherCounts),
        dificultad: getTop(difficultyCounts),
        tema: getModa(topicCounts),
      },
      efectividad: effectiveness,
    };
  }
}
