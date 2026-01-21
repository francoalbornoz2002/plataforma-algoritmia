import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUsersSummaryDto } from '../dto/get-users-summary.dto';
import {
  GetUsersDistributionDto,
  AgrupacionUsuarios,
} from '../dto/get-users-distribution.dto';
import { GetUsersHistoryDto } from '../dto/get-users-history.dto';
import { GetUsersListDto } from '../dto/get-users-list.dto';
import { GetCoursesReportDto } from '../dto/get-courses-report.dto';
import {
  estado_simple,
  Prisma,
  estado_consulta,
  estado_clase_consulta,
  estado_sesion,
  HistorialDificultadAlumno,
  DificultadesCurso,
  Dificultad,
  HistorialProgresoCurso,
  HistorialDificultadesCurso,
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

  async getCoursesReport(dto: GetCoursesReportDto) {
    const { fechaDesde, fechaHasta, estado } = dto;

    const now = new Date();
    // Fecha Inicio: Si no viene, es el inicio de los tiempos
    const start = fechaDesde ? new Date(fechaDesde) : new Date(0);
    if (fechaDesde) {
      start.setUTCHours(0, 0, 0, 0);
    }

    // Fecha Fin: Si no viene, es "ahora". Si viene, es el final de ese día
    let end = now;
    if (fechaHasta) {
      end = new Date(fechaHasta);
      end.setUTCHours(23, 59, 59, 999);
    }

    // Determinamos el modo: ¿Es reporte actual o histórico?
    // Si la fecha fin es mayor o igual a "ahora", usamos el estado actual (tablas principales).
    // Si es pasado, usamos las tablas de historial.
    const isCurrent = end >= now;

    // 1. Filtro de Cursos (Universo de cursos existentes en la fecha de corte)
    const whereCurso: Prisma.CursoWhereInput = {
      createdAt: { lte: end }, // El curso debía existir en la fecha de corte
    };

    if (estado) {
      if (estado === estado_simple.Activo) {
        // Activo: No borrado O borrado después de la fecha de corte
        if (isCurrent) {
          whereCurso.deletedAt = null;
        } else {
          whereCurso.OR = [{ deletedAt: null }, { deletedAt: { gt: end } }];
        }
      } else if (estado === estado_simple.Inactivo) {
        // Inactivo: Borrado antes o en la fecha de corte
        if (isCurrent) {
          whereCurso.deletedAt = { not: null };
        } else {
          whereCurso.deletedAt = { lte: end, not: null };
        }
      }
    }

    // Obtenemos los cursos
    const cursos = await this.prisma.curso.findMany({
      where: whereCurso,
      select: {
        id: true,
        nombre: true,
        deletedAt: true,
        idProgreso: true,
        idDificultadesCurso: true,
        // Optimizacion: Traemos datos actuales solo si estamos en modo actual
        progresoCurso: isCurrent ? true : false,
        dificultadesCurso: isCurrent
          ? { include: { dificultadModa: true } }
          : false,
      },
      orderBy: { nombre: 'asc' },
    });

    // 2. Métricas Globales (Resumen)
    const totalCursos = cursos.length;
    let cursosActivos = 0;
    let cursosInactivos = 0;

    // Helper para determinar estado de un curso en la fecha 'end'
    const getCursoStatusAt = (c: { deletedAt: Date | null }) => {
      if (!c.deletedAt) return 'Activo';
      return c.deletedAt > end ? 'Activo' : 'Inactivo';
    };

    cursos.forEach((c) => {
      const status = getCursoStatusAt(c);
      if (status === 'Activo') cursosActivos++;
      else cursosInactivos++;
    });

    // 3. Procesar métricas por curso
    const data = await Promise.all(
      cursos.map(async (curso) => {
        const cursoStatus = getCursoStatusAt(curso);

        // --- A. Alumnos y Docentes Activos (Snapshot a la fecha 'end') ---
        // Usamos las tablas de relación verificando fechas de alta/baja
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

        // --- B. Progreso (% Avance) ---
        let avancePromedio = 0;
        if (isCurrent && curso.progresoCurso) {
          // Modo Actual: Leemos directamente de la tabla agregada
          avancePromedio = Number(curso.progresoCurso.pctMisionesCompletadas);
        } else {
          // Modo Histórico: Buscamos el último snapshot en el historial
          const histProg = await this.prisma.historialProgresoCurso.findFirst({
            where: {
              idProgresoCurso: curso.idProgreso,
              fechaRegistro: { lte: end },
            },
            orderBy: { fechaRegistro: 'desc' },
          });

          if (histProg) {
            avancePromedio = Number(histProg.pctMisionesCompletadas);
          }
        }

        // --- C. Dificultades (Modas y Cantidad) ---
        let cantAlumnosConDificultad = 0;
        let pctAlumnosConDificultad = 0;
        let dificultadFrecuente = 'Ninguna';
        let temaFrecuente = 'Ninguno';

        // C.1 Modas (Dificultad y Tema más frecuente)
        if (isCurrent && curso.dificultadesCurso) {
          // Modo Actual: Usamos la tabla agregada
          if (curso.dificultadesCurso) {
            dificultadFrecuente =
              (
                curso.dificultadesCurso as DificultadesCurso & {
                  dificultadModa: Dificultad | null;
                }
              ).dificultadModa?.nombre || 'Ninguna';
            temaFrecuente = curso.dificultadesCurso.temaModa || 'Ninguno';
          }
        } else {
          // Modo Histórico: Usamos HistorialDificultadesCurso
          const histDif =
            await this.prisma.historialDificultadesCurso.findFirst({
              where: {
                idDificultadesCurso: curso.idDificultadesCurso,
                fechaRegistro: { lte: end },
              },
              orderBy: { fechaRegistro: 'desc' },
            });

          if (histDif) {
            temaFrecuente = histDif.temaModa;
            // Si hay una dificultad moda guardada (ID), buscamos su nombre
            if (histDif.idDificultadModa) {
              const dif = await this.prisma.dificultad.findUnique({
                where: { id: histDif.idDificultadModa },
                select: { nombre: true },
              });
              dificultadFrecuente = dif?.nombre || 'Ninguna';
            }
          }
        }

        // C.2 Cantidad de Alumnos con Dificultad
        // Obtenemos IDs de alumnos activos en la fecha de corte
        const activeStudents = await this.prisma.alumnoCurso.findMany({
          where: {
            idCurso: curso.id,
            fechaInscripcion: { lte: end },
            OR: [{ fechaBaja: null }, { fechaBaja: { gt: end } }],
          },
          select: { idAlumno: true },
        });
        const activeIds = activeStudents.map((a) => a.idAlumno);

        if (activeIds.length > 0) {
          if (isCurrent) {
            // Modo Actual: Contamos en la tabla actual
            const count = await this.prisma.dificultadAlumno.groupBy({
              by: ['idAlumno'],
              where: {
                idCurso: curso.id,
                idAlumno: { in: activeIds },
                grado: { not: 'Ninguno' },
              },
            });
            cantAlumnosConDificultad = count.length;
          } else {
            // Modo Histórico: Reconstruimos desde HistorialDificultadAlumno
            // Buscamos el último estado de cada alumno antes de la fecha 'end'
            const history =
              await this.prisma.historialDificultadAlumno.findMany({
                where: {
                  idCurso: curso.id,
                  idAlumno: { in: activeIds },
                  fechaCambio: { lte: end },
                },
                orderBy: { fechaCambio: 'asc' }, // Orden ascendente para procesar cambios
                select: { idAlumno: true, idDificultad: true, grado: true },
              });

            // Mapa para obtener el estado final de cada par Alumno-Dificultad
            const mapState = new Map<string, string>();
            history.forEach((h) => {
              const key = `${h.idAlumno}-${h.idDificultad}`;
              mapState.set(key, h.grado); // Sobreescribe con el último valor
            });

            // Contamos alumnos únicos que tengan al menos una dificultad activa (!= Ninguno)
            const studentsWithDif = new Set<string>();
            mapState.forEach((grado, key) => {
              if (grado !== 'Ninguno') {
                const [idAlumno] = key.split('-');
                studentsWithDif.add(idAlumno);
              }
            });
            cantAlumnosConDificultad = studentsWithDif.size;
          }
        }

        pctAlumnosConDificultad =
          alumnosActivos > 0
            ? (cantAlumnosConDificultad / alumnosActivos) * 100
            : 0;

        // --- Métricas de Flujo (Siempre filtradas por fecha) ---
        // E. Consultas
        const consultasTotal = await this.prisma.consulta.count({
          where: {
            idCurso: curso.id,
            fechaConsulta: { gte: start, lte: end },
          },
        });
        const consultasResueltas = await this.prisma.consulta.count({
          where: {
            idCurso: curso.id,
            fechaConsulta: { gte: start, lte: end },
            estado: 'Resuelta',
          },
        });
        const pctConsultasResueltas =
          consultasTotal > 0 ? (consultasResueltas / consultasTotal) * 100 : 0;

        // F. Clases de Consulta
        const clasesTotal = await this.prisma.claseConsulta.count({
          where: {
            idCurso: curso.id,
            fechaClase: { gte: start, lte: end },
          },
        });
        const clasesRealizadas = await this.prisma.claseConsulta.count({
          where: {
            idCurso: curso.id,
            fechaClase: { gte: start, lte: end },
            estadoClase: 'Realizada',
          },
        });
        const pctClasesRealizadas =
          clasesTotal > 0 ? (clasesRealizadas / clasesTotal) * 100 : 0;

        // G. Sesiones de Refuerzo
        const sesionesTotal = await this.prisma.sesionRefuerzo.count({
          where: {
            idCurso: curso.id,
            createdAt: { gte: start, lte: end },
          },
        });
        const sesionesCompletadas = await this.prisma.sesionRefuerzo.count({
          where: {
            idCurso: curso.id,
            createdAt: { gte: start, lte: end },
            estado: 'Completada',
          },
        });
        const pctSesionesCompletadas =
          sesionesTotal > 0 ? (sesionesCompletadas / sesionesTotal) * 100 : 0;

        return {
          id: curso.id,
          nombre: curso.nombre,
          estado: cursoStatus,
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
            total: consultasTotal,
            pctResueltas: parseFloat(pctConsultasResueltas.toFixed(2)),
          },
          clases: {
            total: clasesTotal,
            pctRealizadas: parseFloat(pctClasesRealizadas.toFixed(2)),
          },
          sesiones: {
            total: sesionesTotal,
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
