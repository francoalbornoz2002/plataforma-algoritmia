import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseConsultationsHistoryDto {
  @IsOptional()
  @IsString()
  temas?: string; // Separados por coma: "Logica,Variables"

  @IsOptional()
  @IsString()
  estados?: string; // Separados por coma: "Pendiente,Resuelta"

  @IsOptional()
  @IsString()
  alumnos?: string; // IDs separados por coma

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

export class GetCourseConsultationsHistoryPdfDto extends GetCourseConsultationsHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
