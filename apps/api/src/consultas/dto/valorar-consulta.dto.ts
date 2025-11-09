import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValorarConsultaDto {
  @ApiProperty({
    description: 'Valoración numérica de 1 a 5 estrellas.',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  valoracion: number;

  @ApiProperty({
    description: 'Comentario opcional del alumno sobre la respuesta.',
    example: '¡Me sirvió muchísimo, gracias!',
    required: false,
  })
  @IsOptional()
  @IsString()
  comentarioValoracion?: string;
}
