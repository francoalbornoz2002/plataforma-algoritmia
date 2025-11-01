import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { dias_semana, modalidad } from '@prisma/client';

export class DiaClaseDto {
  @IsUUID()
  @IsOptional()
  id: string | null;

  @IsEnum(dias_semana)
  dia: dias_semana;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/) // Valida formato "HH:mm"
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/) // Valida formato "HH:mm"
  horaFin: string;

  @IsEnum(modalidad)
  modalidad: modalidad;
}
