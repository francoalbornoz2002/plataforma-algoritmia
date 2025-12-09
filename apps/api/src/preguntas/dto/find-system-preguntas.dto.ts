import { IsEnum, IsUUID } from 'class-validator';
import { grado_dificultad } from '@prisma/client';

export class FindSystemPreguntasDto {
  @IsUUID()
  idDificultad: string;

  @IsEnum(grado_dificultad)
  gradoDificultad: grado_dificultad;
}
