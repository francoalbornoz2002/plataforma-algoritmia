import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRespuestaDto {
  @ApiProperty({
    description: 'El texto de la respuesta del docente.',
    example: '¡Hola Franco! La clave está en la variable de control...',
  })
  @IsString()
  @MinLength(5)
  descripcion: string;
}
