import { IsOptional, IsString } from 'class-validator';
import { FindStudentProgressDto } from '../../progress/dto/find-student-progress.dto';

export class GetStudentProgressListReportDto extends FindStudentProgressDto {
  @IsOptional()
  @IsString()
  fechaCorte?: string;
}