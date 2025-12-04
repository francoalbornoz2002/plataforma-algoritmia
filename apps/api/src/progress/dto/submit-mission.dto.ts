import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class SubmitMissionDto {
  @ApiProperty({
    description: 'El UUID del alumno que completó la misión.',
    example: '5f085294-79cc-4731-99fd-12bcd4849599',
  })
  @IsUUID()
  idAlumno: string;

  @ApiProperty({
    description: 'El UUID de la misión (de la tabla "misiones").',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  idMision: string;

  @ApiProperty({
    description: 'Cantidad de estrellas obtenidas (0-3).',
    example: 3,
  })
  @IsInt()
  @Min(0)
  @Max(3)
  estrellas: number;

  @ApiProperty({
    description: 'Puntos de experiencia (EXP) ganados.',
    example: 50,
  })
  @IsInt()
  @Min(0)
  exp: number;

  @ApiProperty({
    description: 'Cantidad de intentos que tomó la misión.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  intentos: number;

  @ApiProperty({
    description: 'Fecha y hora (en formato ISO 8601) de cuándo se completó.',
    example: '2025-11-05T02:10:00.000Z',
  })
  @IsDateString()
  fechaCompletado: string;

  // --- NUEVOS CAMPOS PARA MISIONES ESPECIALES ---

  @IsOptional()
  @IsBoolean()
  esMisionEspecial?: boolean;

  // 'nombre' es obligatorio solo si esMisionEspecial es true
  @ValidateIf((o) => o.esMisionEspecial === true)
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  // 'descripcion' es obligatorio solo si esMisionEspecial es true
  @ValidateIf((o) => o.esMisionEspecial === true)
  @IsString()
  @IsNotEmpty()
  descripcion?: string;
}
