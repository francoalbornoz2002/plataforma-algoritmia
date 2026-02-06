import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { fuente_cambio_dificultad } from '@prisma/client';

export class GetStudentDifficultiesReportDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  temas?: string; // "Logica,Secuencia"

  @IsOptional()
  @IsString()
  dificultades?: string; // IDs separados por coma

  @IsOptional()
  @IsEnum(fuente_cambio_dificultad)
  fuente?: fuente_cambio_dificultad;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export class GetStudentDifficultiesReportPdfDto extends GetStudentDifficultiesReportDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
