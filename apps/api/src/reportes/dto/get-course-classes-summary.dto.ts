import { IsOptional, IsDateString } from 'class-validator';

export class GetCourseClassesSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
