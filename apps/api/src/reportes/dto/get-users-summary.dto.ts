import { IsOptional, IsDateString } from 'class-validator';

export class GetUsersSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}
