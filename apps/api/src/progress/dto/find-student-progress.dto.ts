// apps/api/src/progress/dto/find-student-progress.dto.ts
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

// --- Enums para los filtros (los valores que enviará el frontend) ---
export enum ProgressRange {
  ZERO = '0',
  RANGE_1_25 = '1-25',
  RANGE_26_50 = '26-50',
  RANGE_51_75 = '51-75',
  RANGE_76_99 = '76-99',
  FULL = '100',
}

export enum StarsRange {
  LOW = '0-1', // bajo
  MEDIUM = '1.1-2', // medio
  HIGH = '2.1-3', // alto
}

export enum AttemptsRange {
  FAST = '<3', // rápido
  NORMAL = '3-6', // normal
  MANY = '6-9', // muchos
  TOO_MANY = '+10', // demasiados
}

export enum ActivityRange {
  LAST_24H = '24h',
  LAST_3D = '3d',
  LAST_5D = '5d',
  LAST_7D = '7d',
  INACTIVE = 'inactive', // +7 días
}
// (No incluimos 'Rango de fechas' ya que se solapa con 'Última actividad')

export class FindStudentProgressDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProgressRange)
  progressRange?: ProgressRange;

  @IsOptional()
  @IsEnum(StarsRange)
  starsRange?: StarsRange;

  @IsOptional()
  @IsEnum(AttemptsRange)
  attemptsRange?: AttemptsRange;

  @IsOptional()
  @IsEnum(ActivityRange)
  activityRange?: ActivityRange;
}
