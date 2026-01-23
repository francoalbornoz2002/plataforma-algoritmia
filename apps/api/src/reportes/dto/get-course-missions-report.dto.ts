import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { dificultad_mision } from '@prisma/client';

export class GetCourseMissionsReportDto {
  @IsOptional()
  @IsEnum(dificultad_mision)
  dificultad?: dificultad_mision;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
