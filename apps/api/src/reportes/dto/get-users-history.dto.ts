import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { roles } from '@prisma/client';

export class GetUsersHistoryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(roles)
  rol?: roles;
}
