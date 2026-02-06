import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseDifficultiesReportDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}

export class GetCourseDifficultiesReportPdfDto extends GetCourseDifficultiesReportDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
