import { IsOptional, IsDateString } from 'class-validator';

export class GetCourseConsultationsSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
