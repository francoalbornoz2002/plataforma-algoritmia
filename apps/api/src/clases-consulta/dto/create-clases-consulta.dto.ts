import { ApiProperty } from '@nestjs/swagger';
import { modalidad } from '@prisma/client';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  ArrayMinSize,
  IsString,
} from 'class-validator';

export class CreateClasesConsultaDto {
  @ApiProperty({
    description: 'El ID del curso al que pertenece esta clase.',
    example: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
  })
  @IsUUID()
  idCurso: string;

  @ApiProperty({
    description: 'El ID del docente que estará a cargo de la clase.',
    example: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
  })
  @IsUUID()
  idDocente: string; // El "docente a cargo"

  @ApiProperty({
    description: 'Nombre o título de la clase de consulta.',
    example: 'Clase de Repaso: Estructuras Repetitivas',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Descripción breve de los temas a tratar.',
    example: 'Revisaremos bucles For y While, y dudas sobre Lógica.',
  })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Fecha y hora de inicio (ISO 8601)' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha y hora de fin (ISO 8601)' })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({
    description: 'Modalidad de la clase (Presencial, Virtual, Hibrida).',
    enum: modalidad,
  })
  @IsEnum(modalidad)
  modalidad: modalidad;

  @ApiProperty({
    description: 'Array de IDs (UUIDs) de las consultas a revisar.',
    example: ['uuid1...', 'uuid2...', 'uuid3...', 'uuid4...', 'uuid5...'],
  })
  @IsArray()
  @IsUUID('all', {
    each: true,
    message: 'Cada consulta debe ser un UUID válido.',
  }) // Valida que cada elemento sea UUID
  @ArrayMinSize(5, {
    message: 'Se deben seleccionar al menos 5 consultas a revisar.',
  })
  consultasIds: string[];
}
