import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { estado_simple } from '@prisma/client';

export class FindAllCoursesDto {
  // --- PAGINACIÓN --- //
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  limit: number;

  // --- ORDENAMIENTO ---
  @IsOptional()
  @IsString()
  sort: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc';

  // --- FILTROS --- //
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(estado_simple) // Valida que sea 'Activo' o 'Inactivo'
  estado?: estado_simple;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  docenteIds?: string[];
}
