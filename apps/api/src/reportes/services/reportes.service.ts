import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUsersReportDto } from '../dto/get-users-report.dto';
import { GetCoursesReportDto } from '../dto/get-courses-report.dto';
import {
  estado_simple,
  Prisma,
  estado_consulta,
  estado_clase_consulta,
  estado_sesion,
  HistorialDificultadAlumno,
} from '@prisma/client';

const TOTAL_MISIONES = 10;

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersReport(dto: GetUsersReportDto) {
    const { fechaDesde, fechaHasta, rol, estado } = dto;

    // 1. Filtros para la lista principal y conteos generales
    const where: Prisma.UsuarioWhereInput = {};

    // Filtro de fechas (sobre createdAt)
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
    }

    // Filtro de Rol
    if (rol) {
      where.rol = rol;
    }

    // Filtro de Estado
    if (estado) {
      if (estado === estado_simple.Activo) {
        where.deletedAt = null;
      } else if (estado === estado_simple.Inactivo) {
        where.deletedAt = { not: null };
      }
    }

    // 2. Ejecutar consultas principales
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosInactivos,
      usuariosPorRol,
      listaUsuarios,
    ] = await this.prisma.$transaction([
      // Total (según filtros)
      this.prisma.usuario.count({ where }),
      // Activos (según filtros + condición de activo)
      this.prisma.usuario.count({ where: { ...where, deletedAt: null } }),
      // Inactivos (según filtros + condición de inactivo)
      this.prisma.usuario.count({
        where: { ...where, deletedAt: { not: null } },
      }),
      // Distribución por Rol (según filtros)
      this.prisma.usuario.groupBy({
        by: ['rol'],
        where,
        _count: { rol: true },
      }),
      // Lista de usuarios (según filtros)
      this.prisma.usuario.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    // 3. Calcular Variaciones Anuales (KPIs de "Último Año")
    // Estos KPIs respetan el filtro de ROL, pero ignoran fechas y estado
    // para mostrar la tendencia histórica real (Altas y Bajas).
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    const whereVariacion: Prisma.UsuarioWhereInput = {};
    if (rol) whereVariacion.rol = rol;

    const [
      altasUltimoAnio,
      altasAnioAnterior,
      bajasUltimoAnio,
      bajasAnioAnterior,
    ] = await this.prisma.$transaction([
      // Altas (createdAt)
      this.prisma.usuario.count({
        where: {
          ...whereVariacion,
          createdAt: { gte: oneYearAgo, lte: now },
        },
      }),
      this.prisma.usuario.count({
        where: {
          ...whereVariacion,
          createdAt: { gte: twoYearsAgo, lt: oneYearAgo },
        },
      }),
      // Bajas (deletedAt)
      this.prisma.usuario.count({
        where: {
          ...whereVariacion,
          deletedAt: { gte: oneYearAgo, lte: now },
        },
      }),
      this.prisma.usuario.count({
        where: {
          ...whereVariacion,
          deletedAt: { gte: twoYearsAgo, lt: oneYearAgo },
        },
      }),
    ]);

    // Helper para porcentaje
    const calcularVariacion = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return ((actual - anterior) / anterior) * 100;
    };

    return {
      resumen: {
        total: totalUsuarios,
        activos: usuariosActivos,
        inactivos: usuariosInactivos,
        porRol: usuariosPorRol.map((r) => ({
          rol: r.rol,
          cantidad: r._count.rol,
        })),
      },
      variacionAnual: {
        altas: {
          cantidad: altasUltimoAnio,
          variacionPct: parseFloat(
            calcularVariacion(altasUltimoAnio, altasAnioAnterior).toFixed(2),
          ),
        },
        bajas: {
          cantidad: bajasUltimoAnio,
          variacionPct: parseFloat(
            calcularVariacion(bajasUltimoAnio, bajasAnioAnterior).toFixed(2),
          ),
        },
      },
      data: listaUsuarios,
    };
  }

  async getCoursesReport(dto: GetCoursesReportDto) {}
}
