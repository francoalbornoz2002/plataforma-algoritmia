import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JoinCourseDto {
  @ApiProperty({
    description: 'Contraseña de acceso al curso',
  })
  @IsString()
  @MinLength(6, {
    message: 'La contraseña de acceso es incorrecta o demasiado corta',
  })
  contrasenaAcceso: string;
}
