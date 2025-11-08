import { Prisma } from '@prisma/client';

export interface LogData {
  tablaAfectada: string;
  idFilaAfectada: string;
  operacion: string; // 'INSERT', 'UPDATE', 'DELETE'
  idUsuarioModifico: string | null;
  valoresAnteriores: Prisma.InputJsonValue;
  valoresNuevos: Prisma.InputJsonValue;
}
