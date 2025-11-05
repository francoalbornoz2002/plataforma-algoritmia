import { IsEnum, IsUUID } from 'class-validator';
import { grado_dificultad } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitDifficultyDto {
  @ApiProperty({
    description: 'El UUID del alumno al que se le registra la dificultad.',
    example: '5f085294-79cc-4731-99fd-12bcd4849599',
  })
  @IsUUID()
  idAlumno: string;

  @ApiProperty({
    description: 'El UUID de la dificultad (de la tabla "dificultades").',
    example: '4d4d4d4d-4444-4444-8444-444444444444',
  })
  @IsUUID()
  idDificultad: string;

  @ApiProperty({
    description: 'El nuevo grado de dificultad detectado para el alumno.',
    example: 'Medio',
    enum: grado_dificultad, // <-- Esto crea un dropdown en Swagger
    enumName: 'grado_dificultad',
  })
  @IsEnum(grado_dificultad)
  grado: grado_dificultad;
}
