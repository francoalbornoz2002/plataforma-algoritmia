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
import { estado_simple, Prisma } from '@prisma/client';

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
}
