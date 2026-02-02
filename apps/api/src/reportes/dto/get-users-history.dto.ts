import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { roles } from '@prisma/client';

export enum TipoMovimientoUsuario {
  TODOS = 'Todos',
  ALTA = 'Alta',
  BAJA = 'Baja',
}

export class GetUsersHistoryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(roles)
  rol?: roles;

  @IsOptional()
  @IsEnum(TipoMovimientoUsuario)
  tipoMovimiento?: TipoMovimientoUsuario = TipoMovimientoUsuario.TODOS;
}
