import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';
import { estado_sesion, grado_dificultad } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindAllSesionesDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  nroSesion?: number;

  @IsOptional()
  @IsUUID()
  idAlumno?: string;

  @IsOptional()
  @IsUUID()
  idDocente?: string;

  @IsOptional()
  @IsString()
  idDificultad?: string;

  @IsOptional()
  @IsEnum(grado_dificultad)
  gradoSesion?: grado_dificultad;

  @IsOptional()
  @IsEnum(estado_sesion)
  estado?: estado_sesion;
}
