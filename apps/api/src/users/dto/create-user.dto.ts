import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '@prisma/client';

import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

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
  @IsEnum(Rol)
  rol: Rol;
}
