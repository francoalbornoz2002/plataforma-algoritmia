import { ApiProperty } from '@nestjs/swagger';
import { generos, roles } from '@prisma/client';

import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsString()
  @MinLength(1)
  nombre: string;

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(1)
  apellido: string;

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(7)
  @MaxLength(9)
  dni: string;

  @ApiProperty({ required: true })
  @IsDate()
  @IsNotEmpty()
  fechaNacimiento: Date;

  @ApiProperty({ required: true })
  @IsEnum(generos)
  @IsNotEmpty()
  genero: generos;

  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @Transform(({ value }: TransformFnParams) => {
    // Si el valor es null, undefined, etc., devuelve un string vacío.
    // Si no, convierte el valor a string y luego aplica trim().
    // Esto garantiza que siempre retornes un string.
    return value ? String(value).trim() : '';
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: true })
  @IsEnum(roles)
  rol: roles;
}
