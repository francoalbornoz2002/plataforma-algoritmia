import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class FinalizarClaseDto {
  @IsBoolean()
  realizada: boolean;

  @IsOptional()
  @IsString()
  motivo?: string; // Se enviará si realizada = false

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  consultasRevisadasIds?: string[]; // Se enviará si realizada = true
}
