import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { grado_dificultad } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateSesionesRefuerzoDto {
  @IsUUID()
  idAlumno: string;

  @IsString()
  idDificultad: string;

  @IsEnum(grado_dificultad)
  gradoSesion: grado_dificultad;

  @IsDateString()
  fechaHoraLimite: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number) // Transforma el string del FormData a número
  tiempoLimite: number;

  @IsArray({ message: 'Las preguntas deben ser un arreglo.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada elemento de preguntas debe ser un UUID válido.',
  })
  preguntas: string[];
}
