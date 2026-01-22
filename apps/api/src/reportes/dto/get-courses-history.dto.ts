import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum TipoMovimientoCurso {
  TODOS = 'Todos',
  ALTA = 'Alta',
  BAJA = 'Baja',
}

export class GetCoursesHistoryDto {
  @IsOptional()
  @IsEnum(TipoMovimientoCurso)
  tipoMovimiento?: TipoMovimientoCurso;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
