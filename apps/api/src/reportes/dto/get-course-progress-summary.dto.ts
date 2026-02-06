import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetCourseProgressSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;
}

export class GetCourseProgressSummaryPdfDto extends GetCourseProgressSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
