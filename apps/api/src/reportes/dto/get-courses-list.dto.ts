import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { estado_simple } from '@prisma/client';

export class GetCoursesListDto {
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
