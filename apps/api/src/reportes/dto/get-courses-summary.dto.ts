import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { estado_simple } from '@prisma/client';

export class GetCoursesSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;

  @IsOptional()
  @IsEnum(estado_simple)
  estado?: estado_simple;

  @IsOptional()
  @IsString()
  search?: string;
}

// DTO Extendido exclusivo para la exportación PDF
export class GetCoursesSummaryPdfDto extends GetCoursesSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
