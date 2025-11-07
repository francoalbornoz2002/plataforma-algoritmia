import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInstitucionDto {
  @ApiProperty({ description: 'ID de la localidad seleccionada' })
  @IsInt()
  idLocalidad: number;

  @ApiProperty({ description: 'Nombre de la institución' })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiProperty({ description: 'Domicilio de la institución' })
  @IsString()
  @MinLength(5)
  direccion: string;

  @ApiProperty({ description: 'Email de contacto' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Teléfono de contacto' })
  @IsString()
  @MinLength(7)
  telefono: string;
}
