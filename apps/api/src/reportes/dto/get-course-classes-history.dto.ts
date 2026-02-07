import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseClassesHistoryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  docenteId?: string;
}

export class GetCourseClassesHistoryPdfDto extends GetCourseClassesHistoryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
