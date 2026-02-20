import {
  Injectable,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindAuditoriaLogsDto } from '../dto/find-audit-logs.dto';
import { stringify } from 'csv-stringify';

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene los logs de auditoría con filtros, paginación y ordenamiento.
   */
  async findAll(dto: FindAuditoriaLogsDto) {
    const { page = 1, limit = 10, sort, order } = dto;

    const skip = (page - 1) * limit;
    const take = limit;

    const where = this.buildWhereClause(dto);
    const orderBy = this.buildOrderByClause(sort, order);

    // 3. Ejecutar consultas
    try {
      const [logs, total] = await this.prisma.$transaction([
        this.prisma.logAuditoria.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            usuarioModifico: {
              select: { nombre: true, apellido: true, email: true },
            },
          },
        }),
        this.prisma.logAuditoria.count({ where }),
      ]);

      const safeLogs = logs.map((log) => ({
        ...log,
        id: log.id.toString(),
      }));

      const totalPages = Math.ceil(total / limit);
      return { data: safeLogs, total, page, totalPages };
    } catch (error) {
      console.error('Error en AuditoriaService.findAll:', error);
      throw new InternalServerErrorException(
        'Error al obtener los logs de auditoría.',
      );
    }
  }

  /**
   * Genera un stream CSV con todos los logs que coincidan con los filtros.
   */
  async getAuditoriaLogsCsv(
    dto: FindAuditoriaLogsDto,
  ): Promise<StreamableFile> {
    const where = this.buildWhereClause(dto);
    const orderBy = this.buildOrderByClause(dto.sort, dto.order);

    // Obtenemos TODOS los registros (sin paginación)
    // NOTA: Para datasets masivos (>100k), idealmente usaríamos un cursor o paginación interna
    // para alimentar el stream, pero para este caso de uso, findMany es suficiente y seguro
    // ya que el stringify maneja el flujo de salida.
    const logs = await this.prisma.logAuditoria.findMany({
      where,
      orderBy,
      include: {
        usuarioModifico: {
          select: { nombre: true, apellido: true, email: true },
        },
      },
    });

    const stringifier = stringify({
      header: false, // Desactivamos header automático para personalizar
      delimiter: ';', // Punto y coma es mejor para Excel en español
      bom: true, // Byte Order Mark para que Excel reconozca UTF-8
    });

    // --- A. Título y Metadatos ---
    // Rellenamos con celdas vacías para mantener la estructura de columnas (10 columnas)
    // Esto ayuda a Excel a detectar correctamente el delimitador.
    stringifier.write([
      'REPORTE DE AUDITORÍA',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    stringifier.write([
      'Fecha de generación:',
      new Date().toLocaleString(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    stringifier.write(['', '', '', '', '', '', '', '', '', '']); // Fila vacía

    // --- B. Filtros ---
    const filtros: string[] = [];
    if (dto.fechaDesde) filtros.push(`Desde: ${dto.fechaDesde}`);
    if (dto.fechaHasta) filtros.push(`Hasta: ${dto.fechaHasta}`);
    if (dto.tablaAfectada) filtros.push(`Tabla: ${dto.tablaAfectada}`);
    if (dto.operacion) filtros.push(`Operación: ${dto.operacion}`);
    if (dto.search) filtros.push(`Búsqueda: ${dto.search}`);

    // Distribuimos los filtros en columnas separadas para evitar que la columna de Fecha se ensanche demasiado
    const filtrosRow = [
      'Filtros Aplicados:',
      ...(filtros.length > 0 ? filtros : ['Ninguno']),
    ];
    while (filtrosRow.length < 10) {
      filtrosRow.push('');
    }
    stringifier.write(filtrosRow);
    stringifier.write(['', '', '', '', '', '', '', '', '', '']); // Fila vacía

    // --- C. Cabeceras de Columnas ---
    stringifier.write([
      'ID',
      'Fecha',
      'Hora',
      'Usuario',
      'Email',
      'Operación',
      'Tabla',
      'ID Fila',
      'Valores Anteriores',
      'Valores Nuevos',
    ]);

    // Alimentamos el stream
    for (const log of logs) {
      // Detectar Soft Delete
      const isSoftDelete =
        log.operacion === 'UPDATE' &&
        log.valoresAnteriores &&
        (log.valoresAnteriores as any)['deleted_at'] === null &&
        log.valoresNuevos &&
        (log.valoresNuevos as any)['deleted_at'];

      stringifier.write([
        log.id.toString(),
        log.fechaHora.toISOString().split('T')[0],
        log.fechaHora.toISOString().split('T')[1].substring(0, 8),
        log.usuarioModifico
          ? `${log.usuarioModifico.nombre} ${log.usuarioModifico.apellido}`
          : 'Sistema',
        log.usuarioModifico?.email || '-',
        isSoftDelete ? 'DELETE' : log.operacion,
        log.tablaAfectada,
        log.idFilaAfectada,
        log.valoresAnteriores ? JSON.stringify(log.valoresAnteriores) : '',
        log.valoresNuevos ? JSON.stringify(log.valoresNuevos) : '',
      ]);
    }

    stringifier.end();

    return new StreamableFile(stringifier, {
      type: 'text/csv',
      disposition: 'attachment; filename="auditoria.csv"',
    });
  }

  // --- Helpers Privados ---

  private buildWhereClause(
    dto: FindAuditoriaLogsDto,
  ): Prisma.LogAuditoriaWhereInput {
    const { fechaDesde, fechaHasta, tablaAfectada, operacion, search } = dto;

    // 1. Construir el WHERE dinámicamente
    const where: Prisma.LogAuditoriaWhereInput = {};

    if (tablaAfectada) {
      where.tablaAfectada = { equals: tablaAfectada, mode: 'insensitive' };
    }

    if (search) {
      // Busca en 'tablaAfectada' O 'idFilaAfectada'
      where.OR = [
        { tablaAfectada: { contains: search, mode: 'insensitive' } },
        { idFilaAfectada: { contains: search, mode: 'insensitive' } },
        {
          usuarioModifico: {
            nombre: { contains: search, mode: 'insensitive' },
          },
        },
        {
          usuarioModifico: {
            apellido: { contains: search, mode: 'insensitive' },
          },
        },
        {
          usuarioModifico: { email: { contains: search, mode: 'insensitive' } },
        },
        { usuarioModifico: { dni: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (fechaDesde || fechaHasta) {
      where.fechaHora = {};
      if (fechaDesde) {
        where.fechaHora.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        // Ajustamos la fecha "hasta" para incluir el día entero
        const hasta = new Date(fechaHasta);
        hasta.setDate(hasta.getDate() + 1); // Se vuelve "hasta" las 00:00 del día siguiente
        where.fechaHora.lt = hasta;
      }
    }

    if (operacion === 'DELETE') {
      // 1. Si el frontend pide "DELETE" (Baja Lógica)...
      where.operacion = 'UPDATE'; // ...buscamos un UPDATE...

      // ...donde 'deletedAt' pasó de NULL...
      where.valoresAnteriores = {
        path: ['deleted_at'],
        equals: Prisma.JsonNull,
      };

      // ...a NO-NULL (una fecha).
      where.valoresNuevos = {
        path: ['deleted_at'],
        not: Prisma.JsonNull,
      };
    } else if (operacion) {
      // 2. Si es "CREATE" o "UPDATE", lo buscamos tal cual.
      where.operacion = { equals: operacion, mode: 'insensitive' };
    }

    return where;
  }

  private buildOrderByClause(
    sort?: string,
    order?: 'asc' | 'desc',
  ): Prisma.LogAuditoriaOrderByWithRelationInput {
    const validSortFields = [
      'fechaHora',
      'tablaAfectada',
      'operacion',
      'idFilaAfectada',
      'idUsuarioModifico',
    ];
    const sortBy = sort && validSortFields.includes(sort) ? sort : 'fechaHora';

    return {
      [sortBy]: order || 'desc',
    } as Prisma.LogAuditoriaOrderByWithRelationInput;
  }
}
