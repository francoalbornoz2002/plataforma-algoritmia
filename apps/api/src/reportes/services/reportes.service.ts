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

  async getCoursesReport(dto: GetCoursesReportDto) {
    const { fechaDesde, fechaHasta, estado } = dto;

    // Fechas de corte
    const now = new Date();
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0); // Inicio de los tiempos
    const end = fechaHasta ? new Date(fechaHasta) : now;

    // 1. Filtro de Cursos
    const whereCurso: Prisma.CursoWhereInput = {};
    if (estado) {
      if (estado === estado_simple.Activo) whereCurso.deletedAt = null;
      if (estado === estado_simple.Inactivo)
        whereCurso.deletedAt = { not: null };
    }

    // 2. Obtener Cursos
    const cursos = await this.prisma.curso.findMany({
      where: whereCurso,
      select: { id: true, nombre: true, deletedAt: true },
      orderBy: { nombre: 'asc' },
    });

    // 3. Calcular Resumen Global
    const totalCursos = await this.prisma.curso.count();
    const cursosActivos = await this.prisma.curso.count({
      where: { deletedAt: null },
    });
    const cursosInactivos = await this.prisma.curso.count({
      where: { deletedAt: { not: null } },
    });

    // 4. Procesar métricas por curso (Paralelizado)
    const data = await Promise.all(
      cursos.map(async (curso) => {
        // A. Alumnos y Docentes Activos (en la fecha de corte 'end')
        const alumnosActivos = await this.prisma.alumnoCurso.count({
          where: {
            idCurso: curso.id,
            fechaInscripcion: { lte: end },
            OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
          },
        });

        const docentesActivos = await this.prisma.docenteCurso.count({
          where: {
            idCurso: curso.id,
            fechaAsignacion: { lte: end },
            OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
          },
        });

        // B. Progreso (% Avance Promedio)
        const alumnosData = await this.prisma.alumnoCurso.findMany({
          where: {
            idCurso: curso.id,
            fechaInscripcion: { lte: end },
            OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
          },
          select: { idProgreso: true },
        });
        const progresoIds = alumnosData.map((a) => a.idProgreso);

        let avancePromedio = 0;
        if (progresoIds.length > 0) {
          const misionesPorAlumno = await this.prisma.misionCompletada.groupBy({
            by: ['idProgreso'],
            where: {
              idProgreso: { in: progresoIds },
              fechaCompletado: { lte: end },
            },
            _count: { idMision: true },
          });

          const sumaPorcentajes = misionesPorAlumno.reduce((acc, curr) => {
            const pct = (curr._count.idMision / TOTAL_MISIONES) * 100;
            return acc + (pct > 100 ? 100 : pct);
          }, 0);

          avancePromedio = sumaPorcentajes / progresoIds.length;
        }

        // C. Dificultades (Snapshot a la fecha 'end')
        const historialCompleto = await this.prisma.$queryRaw<
          { id_alumno: string; id_dificultad: string; grado: string }[]
        >`
          SELECT DISTINCT ON (id_alumno, id_dificultad) id_alumno, id_dificultad, grado
          FROM historial_dificultades
          WHERE id_curso = ${curso.id}::uuid AND fecha_cambio <= ${end}
          ORDER BY id_alumno, id_dificultad, fecha_cambio DESC
        `;

        const activosConDificultad = historialCompleto.filter(
          (h) => h.grado !== 'Ninguno',
        );
        const alumnosConDificultadSet = new Set(
          activosConDificultad.map((h) => h.id_alumno),
        );
        const cantAlumnosConDificultad = alumnosConDificultadSet.size;
        const pctAlumnosConDificultad =
          alumnosActivos > 0
            ? (cantAlumnosConDificultad / alumnosActivos) * 100
            : 0;

        // Moda de Dificultad y Tema
        let dificultadFrecuente = 'Ninguna';
        let temaFrecuente = 'Ninguno';

        if (activosConDificultad.length > 0) {
          const difIds = activosConDificultad.map((d) => d.id_dificultad);
          const dificultadesInfo = await this.prisma.dificultad.findMany({
            where: { id: { in: difIds } },
            select: { id: true, nombre: true, tema: true },
          });
          const difMap = new Map(dificultadesInfo.map((d) => [d.id, d]));

          const difCount: Record<string, number> = {};
          const temaCount: Record<string, number> = {};

          activosConDificultad.forEach((h) => {
            const info = difMap.get(h.id_dificultad);
            if (info) {
              difCount[info.nombre] = (difCount[info.nombre] || 0) + 1;
              temaCount[info.tema] = (temaCount[info.tema] || 0) + 1;
            }
          });

          if (Object.keys(difCount).length > 0) {
            dificultadFrecuente = Object.keys(difCount).reduce((a, b) =>
              difCount[a] > difCount[b] ? a : b,
            );
          }
          if (Object.keys(temaCount).length > 0) {
            temaFrecuente = Object.keys(temaCount).reduce((a, b) =>
              temaCount[a] > temaCount[b] ? a : b,
            );
          }
        }

        // D. Consultas
        const consultas = await this.prisma.consulta.groupBy({
          by: ['estado'],
          where: {
            idCurso: curso.id,
            fechaConsulta: { gte: start, lte: end },
          },
          _count: true,
        });
        const totalConsultas = consultas.reduce((acc, c) => acc + c._count, 0);
        const resueltas =
          consultas.find((c) => c.estado === estado_consulta.Resuelta)
            ?._count || 0;
        const pctConsultasResueltas =
          totalConsultas > 0 ? (resueltas / totalConsultas) * 100 : 0;

        // E. Clases de Consulta
        const clases = await this.prisma.claseConsulta.groupBy({
          by: ['estadoClase'],
          where: {
            idCurso: curso.id,
            fechaClase: { gte: start, lte: end },
          },
          _count: true,
        });
        const totalClases = clases.reduce((acc, c) => acc + c._count, 0);
        const clasesRealizadas =
          clases.find(
            (c) =>
              c.estadoClase === estado_clase_consulta.Realizada ||
              c.estadoClase === estado_clase_consulta.Finalizada,
          )?._count || 0;
        const pctClasesRealizadas =
          totalClases > 0 ? (clasesRealizadas / totalClases) * 100 : 0;

        // F. Sesiones de Refuerzo
        const sesiones = await this.prisma.sesionRefuerzo.groupBy({
          by: ['estado'],
          where: {
            idCurso: curso.id,
            createdAt: { gte: start, lte: end },
          },
          _count: true,
        });
        const totalSesiones = sesiones.reduce((acc, c) => acc + c._count, 0);
        const sesionesCompletadas =
          sesiones.find((c) => c.estado === estado_sesion.Completada)?._count ||
          0;
        const pctSesionesCompletadas =
          totalSesiones > 0 ? (sesionesCompletadas / totalSesiones) * 100 : 0;

        return {
          id: curso.id,
          nombre: curso.nombre,
          estado: curso.deletedAt ? 'Inactivo' : 'Activo',
          alumnosActivos,
          docentesActivos,
          avancePromedio: parseFloat(avancePromedio.toFixed(2)),
          alumnosConDificultad: {
            cantidad: cantAlumnosConDificultad,
            porcentaje: parseFloat(pctAlumnosConDificultad.toFixed(2)),
          },
          dificultadFrecuente,
          temaFrecuente,
          consultas: {
            total: totalConsultas,
            pctResueltas: parseFloat(pctConsultasResueltas.toFixed(2)),
          },
          clases: {
            total: totalClases,
            pctRealizadas: parseFloat(pctClasesRealizadas.toFixed(2)),
          },
          sesiones: {
            total: totalSesiones,
            pctCompletadas: parseFloat(pctSesionesCompletadas.toFixed(2)),
          },
        };
      }),
    );

    return {
      resumen: {
        total: totalCursos,
        activos: cursosActivos,
        inactivos: cursosInactivos,
      },
      data,
    };
  }
}
