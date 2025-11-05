import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SubmitMissionDto {
  @ApiProperty()
  @IsUUID()
  idAlumno: string;

  @ApiProperty()
  @IsUUID()
  idMision: string; // El UUID de la misión que completó

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(3) // Asumo 3 estrellas como máximo
  estrellas: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  exp: number;

  @ApiProperty()
  @IsInt()
  @IsPositive() // Al menos 1 intento
  intentos: number;

  @ApiProperty()
  @IsDateString() // <-- 2. Añadir la fecha
  fechaCompletado: string; // La enviamos como string ISO (ej: "2025-11-03T20:00:00.000Z")
}
