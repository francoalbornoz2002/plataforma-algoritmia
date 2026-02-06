import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { fuente_cambio_dificultad } from '@prisma/client';

export class GetCourseDifficultiesHistoryDto {
  @IsOptional()
  @IsString()
  temas?: string; // Recibirá temas separados por coma: "Logica,Secuencia"

  @IsOptional()
  @IsString()
  dificultades?: string; // Recibirá IDs separados por coma

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

export class GetCourseDifficultiesHistoryPdfDto extends GetCourseDifficultiesHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
