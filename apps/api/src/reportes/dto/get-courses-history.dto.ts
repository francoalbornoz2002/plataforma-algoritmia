import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

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

// DTO Extendido exclusivo para la exportación PDF
export class GetCoursesHistoryPdfDto extends GetCoursesHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
