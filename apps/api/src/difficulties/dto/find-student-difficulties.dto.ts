import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { grado_dificultad, temas } from '@prisma/client';
import { PaginationDto } from 'src/common/pagination.dto';

export class FindStudentDifficultiesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(temas)
  tema?: temas;

  @IsOptional()
  @IsUUID() // Asumimos que el filtro de dificultad específica usa el ID
  dificultadId?: string;

  @IsOptional()
  @IsEnum(grado_dificultad)
  grado?: grado_dificultad;
}
