import { IsOptional, IsString, IsEnum } from 'class-validator';
import { estado_consulta, temas } from '@prisma/client';
import { PaginationDto } from 'src/common/pagination.dto';

export class FindConsultasDto extends PaginationDto {
  @IsOptional()
  @IsEnum(temas)
  tema?: temas;

  @IsOptional()
  @IsEnum(estado_consulta)
  estado?: estado_consulta;

  @IsOptional()
  @IsString()
  search?: string;
}
