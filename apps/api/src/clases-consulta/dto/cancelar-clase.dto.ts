import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelarClaseDto {
  @ApiProperty({
    description: 'Motivo por el cual se cancela la clase.',
    example: 'Imprevisto de salud del docente.',
  })
  @IsString()
  @IsNotEmpty({ message: 'El motivo de cancelación es obligatorio.' })
  motivo: string;
}
