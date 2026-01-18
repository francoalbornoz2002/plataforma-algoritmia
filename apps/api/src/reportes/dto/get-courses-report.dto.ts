import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { estado_simple } from '@prisma/client';

export class GetCoursesReportDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(estado_simple)
  estado?: estado_simple;
}
