import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { roles } from '@prisma/client';

export class GetUsersListDto {
  @IsOptional()
  @IsDateString()
  fechaCorte?: string;

  @IsOptional()
  @IsEnum(roles)
  rol?: roles;
}
