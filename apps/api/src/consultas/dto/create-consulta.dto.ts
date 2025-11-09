import { IsDateString, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { temas } from '@prisma/client'; // Importamos el enum de Temas

export class CreateConsultaDto {
  @ApiProperty({
    description: 'El título principal de la consulta.',
    example: 'No entiendo los bucles anidados',
  })
  @IsString()
  @MinLength(5)
  titulo: string;

  @ApiProperty({
    description: 'La descripción detallada de la duda.',
    example: 'Cuando intento poner un "mientras" dentro de otro...',
  })
  @IsString()
  @MinLength(10)
  descripcion: string;

  @ApiProperty({
    description: 'El tema de la misión/dificultad relacionada.',
    example: 'Estructuras',
    enum: temas,
  })
  @IsEnum(temas)
  tema: temas;

  @ApiProperty({
    description: 'Fecha (en formato ISO string) de cuándo se hizo la consulta.',
    example: '2025-11-09T12:00:00.000Z',
  })
  @IsDateString()
  fechaConsulta: string;
}
