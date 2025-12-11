import { IsArray, IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { grado_dificultad } from '@prisma/client';

export class CreateSesionesRefuerzoDto {
  @IsUUID()
  idAlumno: string;

  @IsString()
  idDificultad: string;

  @IsEnum(grado_dificultad)
  gradoSesion: grado_dificultad;

  fechaHoraLimite: Date;

  @IsNumber()
  tiempoLimite: number;

  @Transform(({ value }) => JSON.parse(value)) // Lo parsea a array
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada item sea un UUID
  preguntas: string[]; // Array de los ID de preguntas.
}
