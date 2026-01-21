import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum AgrupacionUsuarios {
  ROL = 'ROL',
  ESTADO = 'ESTADO',
  AMBOS = 'AMBOS',
}

export class GetUsersDistributionDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;

  @IsOptional()
  @IsEnum(AgrupacionUsuarios)
  agruparPor?: AgrupacionUsuarios = AgrupacionUsuarios.ROL;
}
