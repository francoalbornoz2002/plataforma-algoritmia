import { IsDateString, IsOptional } from 'class-validator';

export class GetCoursesSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}
