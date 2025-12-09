import { IsEnum, IsString, IsUUID } from 'class-validator';
import { grado_dificultad } from '@prisma/client';

export class FindSystemPreguntasDto {
  @IsString()
  idDificultad: string;

  @IsEnum(grado_dificultad)
  gradoDificultad: grado_dificultad;
}
