import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { roles } from '@prisma/client';

export enum AgrupacionUsuarios {
  ROL = 'ROL',
  ESTADO = 'ESTADO',
  AMBOS = 'AMBOS',
}

export class GetUsersSummaryDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;

  @IsOptional()
  @IsEnum(AgrupacionUsuarios)
  agruparPor?: AgrupacionUsuarios = AgrupacionUsuarios.ROL;

  @IsOptional()
  @IsEnum(roles)
  rol?: roles;
}

// DTO Extendido exclusivo para la exportación PDF
export class GetUsersSummaryPdfDto extends GetUsersSummaryDto {
  @IsOptional()
  @IsString()
  aPresentarA?: string;
}
