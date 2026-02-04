import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseClassesSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export class GetCourseClassesSummaryPdfDto extends GetCourseClassesSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;

  @IsOptional()
  @IsString()
  agruparPor?: 'ESTADO' | 'ORIGEN' | 'AMBOS';
}
