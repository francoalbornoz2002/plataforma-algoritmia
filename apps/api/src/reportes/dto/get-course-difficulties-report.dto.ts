import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum AgrupacionDificultad {
  TEMA = 'TEMA',
  DIFICULTAD = 'DIFICULTAD',
  GRADO = 'GRADO',
  TODO = 'TODO',
}

export class GetCourseDifficultiesReportDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;

  @IsOptional()
  @IsEnum(AgrupacionDificultad)
  agruparPor?: AgrupacionDificultad = AgrupacionDificultad.TODO;
}
