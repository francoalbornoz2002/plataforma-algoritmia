import { IsOptional, IsDateString } from 'class-validator';

export class GetCourseDifficultiesReportDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}
