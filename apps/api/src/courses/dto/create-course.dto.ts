import { ApiProperty } from '@nestjs/swagger';
import { dias_semana, modalidad } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Regex para validar el formato HH:MM (24 horas)
const HORA_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// DTO anidado para validar cada objeto de dia de clase
class DiaClaseDto {
  @ApiProperty()
  @IsEnum(dias_semana)
  dia: dias_semana;

  @ApiProperty({ example: '10:00' })
  @Matches(HORA_REGEX, {
    message:
      'La horaInicio debe tener el formato HH:MM (ej. "09:30" o "22:00")',
  })
  @IsString()
  horaInicio: string;

  @ApiProperty({ example: '12:00' })
  @Matches(HORA_REGEX, {
    message: 'La horaFin debe tener el formato HH:MM (ej. "14:00" o "08:00")',
  })
  @IsString()
  horaFin: string;

  @ApiProperty()
  @IsEnum(modalidad)
  modalidad: modalidad;
}

// DTO principal para la creación del curso
export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  nombre: string;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty()
  @IsString()
  imagenUrl: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  contrasenaAcceso: string;

  @ApiProperty()
  @IsEnum(modalidad)
  modalidadPreferencial: modalidad;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'Cada docenteId debe ser un UUID válido',
  })
  docenteIds: string[];

  @ApiProperty({ type: [DiaClaseDto] })
  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto del array
  @Type(() => DiaClaseDto) // Especifica el tipo para la validación anidada
  diasClase: DiaClaseDto[];
}
