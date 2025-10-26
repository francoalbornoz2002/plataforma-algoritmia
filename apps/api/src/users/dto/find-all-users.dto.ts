// src/users/dto/find-all-users.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Rol } from '@prisma/client'; // Importa tu enum Rol

// Enum para el orden
enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindAllUsersDto {
  // --- Paginación ---
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el string "1" a 1
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el string "10" a 10
  limit?: number = 6; // Tu 'pageSize' por defecto era 6

  // --- Ordenamiento ---
  @IsOptional()
  @IsString()
  sort?: string = 'apellido'; // Campo por defecto

  @IsOptional()
  @IsEnum(SortOrder)
  order?: 'asc' | 'desc' = 'asc'; // Orden por defecto

  // --- Filtros ---
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Esta función se ejecuta ANTES de la validación
    if (typeof value === 'string') {
      return [value]; // Si es un string "ADMIN", conviértelo a ["ADMIN"]
    }
    return value; // Si ya es un array, o undefined, déjalo como está
  })
  @IsArray()
  @IsEnum(Rol, { each: true }) // Valida que cada item del array sea un Rol
  @Type(() => String) // Ayuda a Nest a parsear el array
  roles?: Rol[]; // NestJS lo parsea de roles[]=DOCENTE&roles[]=ADMIN

  @IsOptional()
  @IsString() // Recibimos "true", "false", o ""
  estado?: string;
}
