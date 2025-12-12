import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RespuestaAlumnoDto {
  @IsString()
  @IsNotEmpty()
  idPregunta: string;

  @IsString()
  @IsNotEmpty()
  idOpcionElegida: string;
}

export class ResolverSesionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaAlumnoDto)
  respuestas: RespuestaAlumnoDto[];
}
