import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseConsultationsSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export class GetCourseConsultationsSummaryPdfDto extends GetCourseConsultationsSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;

  @IsOptional()
  @IsString()
  agruparPor?: 'ESTADO' | 'TEMA' | 'AMBOS';
}
