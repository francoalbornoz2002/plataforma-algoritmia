import { grado_dificultad } from '@prisma/client';
import { OpcionRespuestaDto } from './opcion-respuesta.dto';
import { IsArray, IsEnum, IsString, IsUUID } from 'class-validator';

export class CreatePreguntaDto {
  @IsUUID()
  idDificultad: string;

  @IsEnum(grado_dificultad)
  gradoDificultad: grado_dificultad;

  @IsString()
  enunciado: string;

  @IsArray()
  opcionesRespuesta: OpcionRespuestaDto[];
}
