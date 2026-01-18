import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { roles, estado_simple } from '@prisma/client';

export class GetUsersReportDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(roles)
  rol?: roles;

  @IsOptional()
  @IsEnum(estado_simple)
  estado?: estado_simple;
}
