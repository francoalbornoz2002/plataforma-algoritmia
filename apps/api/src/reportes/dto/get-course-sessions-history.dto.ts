import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseSessionsHistoryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  origen?: 'SISTEMA' | 'DOCENTE';

  @IsOptional()
  @IsString()
  docenteId?: string;

  @IsOptional()
  @IsString()
  alumnoId?: string;

  @IsOptional()
  @IsString()
  tema?: string;

  @IsOptional()
  @IsString()
  dificultadId?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}

export class GetCourseSessionsHistoryPdfDto extends GetCourseSessionsHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
