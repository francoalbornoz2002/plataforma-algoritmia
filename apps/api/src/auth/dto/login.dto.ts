import { ApiProperty } from '@nestjs/swagger';
// Importa TransformFnParams para un tipado correcto
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
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
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
