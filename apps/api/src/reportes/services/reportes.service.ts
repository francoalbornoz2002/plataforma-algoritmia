import { Injectable } from '@nestjs/common';
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
}
