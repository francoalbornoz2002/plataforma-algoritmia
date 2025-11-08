import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindAuditoriaLogsDto } from '../dto/find-audit-logs.dto';

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene los logs de auditoría con filtros, paginación y ordenamiento.
   */
  async findAll(dto: FindAuditoriaLogsDto) {
    const {
      page,
      limit,
      sort,
      order,
      fechaDesde,
      fechaHasta,
      tablaAfectada,
      operacion,
      search,
    } = dto;

    const skip = (page - 1) * limit;
    const take = limit;

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

    console.log('OPERACIÓN QUE LLEGA: ' + operacion);

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

    console.log('WHERE QUE LLEGA: ' + JSON.stringify(where));

    // 2. Construir el ORDER BY
    const orderBy: Prisma.LogAuditoriaOrderByWithRelationInput = {
      // Por defecto ordenamos por fecha (más nuevos primero) si no se especifica
      [sort || 'fechaHora']: order || 'desc',
    };

    // 3. Ejecutar consultas
    try {
      const [logs, total] = await this.prisma.$transaction([
        this.prisma.logAuditoria.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            // Incluimos el usuario que hizo el cambio
            usuarioModifico: {
              select: {
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.logAuditoria.count({ where }),
      ]);

      const safeLogs = logs.map((log) => ({
        ...log,
        id: log.id.toString(), // <-- Conversión
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
}
