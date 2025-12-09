import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/pagination.dto';
import { temas, grado_dificultad } from '@prisma/client';

// Este enum nos ayudará con la validación y dará opciones claras al consumidor de la API.
export enum TipoPregunta {
  SISTEMA = 'sistema',
  DOCENTE = 'docente',
}

export class FindPreguntasDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(temas)
  tema?: temas;

  @IsOptional()
  @IsString()
  idDificultad?: string;

  @IsOptional()
  @IsEnum(grado_dificultad)
  gradoDificultad?: grado_dificultad;

  @IsOptional()
  @IsEnum(TipoPregunta)
  tipo?: TipoPregunta;
}
