import { IsOptional, IsDateString } from 'class-validator';

export class GetCourseProgressSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}
