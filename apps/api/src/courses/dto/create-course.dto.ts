// apps/api/src/courses/dto/create-course.dto.ts
import {
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
  MinLength,
  IsEnum,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { DiaClaseDto } from './dia-clase.dto';
import { modalidad } from '@prisma/client';

enum ModalidadValidationEnum {
  Presencial = 'Presencial',
  Virtual = 'Virtual',
}

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsString()
  @MinLength(10)
  descripcion: string;

  @IsString()
  @MinLength(6)
  contrasenaAcceso: string;

  @IsEnum(ModalidadValidationEnum)
  modalidadPreferencial?: modalidad;

  @Transform(({ value }) => JSON.parse(value)) // Lo parsea a array
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada item sea un UUID
  docenteIds: string[];

  @Transform(({ value }) => {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Convertimos manualmente el array de objetos planos
    // en un array de instancias de DiaClaseDto
    return plainToInstance(DiaClaseDto, parsed);
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaClaseDto) // Le dice cómo validar cada objeto del array
  diasClase: DiaClaseDto[];
}
