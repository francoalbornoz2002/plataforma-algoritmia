import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { dificultad_mision } from '@prisma/client';

export class GetCourseMissionDetailReportDto {
  @IsOptional()
  @IsUUID()
  misionId?: string;

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

export class GetCourseMissionDetailReportPdfDto extends GetCourseMissionDetailReportDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
