import { IsOptional, IsDateString } from 'class-validator';

export class GetCourseSessionsSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
