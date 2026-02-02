import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum TipoMovimientoInscripcion {
  TODOS = 'Todos',
  INSCRIPCION = 'Inscripcion',
  BAJA = 'Baja',
}

export class GetStudentEnrollmentHistoryDto {
  @IsOptional()
  @IsEnum(TipoMovimientoInscripcion)
  tipoMovimiento?: TipoMovimientoInscripcion;

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
export class GetStudentEnrollmentHistoryPdfDto extends GetStudentEnrollmentHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
