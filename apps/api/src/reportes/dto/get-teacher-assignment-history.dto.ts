import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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

// DTO Extendido exclusivo para la exportación PDF
export class GetTeacherAssignmentHistoryPdfDto extends GetTeacherAssignmentHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
