import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseSessionsSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export class GetCourseSessionsSummaryPdfDto extends GetCourseSessionsSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;

  @IsOptional()
  @IsString()
  agruparPor?: 'ESTADO' | 'ORIGEN' | 'AMBOS';

  @IsOptional()
  @IsString()
  agruparPorContenido?: 'TEMA' | 'DIFICULTAD' | 'AMBOS';
}
