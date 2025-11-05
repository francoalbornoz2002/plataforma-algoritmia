import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class JoinCourseDto {
  @ApiProperty({
    description: 'ID del curso',
  })
  @IsUUID() // 1. Añadimos la validación para el ID del curso
  idCurso: string;

  @ApiProperty({
    description: 'Contraseña de acceso al curso',
  })
  @IsString()
  @MinLength(6, {
    message: 'La contraseña de acceso es incorrecta o demasiado corta',
  })
  contrasenaAcceso: string;
}
