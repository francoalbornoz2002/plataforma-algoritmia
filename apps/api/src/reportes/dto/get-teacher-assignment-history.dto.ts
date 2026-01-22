import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum TipoMovimientoAsignacion {
  TODOS = 'Todos',
  ASIGNACION = 'Asignacion',
  BAJA = 'Baja',
}

export class GetTeacherAssignmentHistoryDto {
  @IsOptional()
  @IsEnum(TipoMovimientoAsignacion)
  tipoMovimiento?: TipoMovimientoAsignacion;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsUUID()
  cursoId?: string;
}
