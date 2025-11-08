import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class FindAuditoriaLogsDto extends PaginationDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" debe ser una fecha válida.' })
  fechaDesde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" debe ser una fecha válida.' })
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  tablaAfectada?: string; // Ej: 'usuarios', 'cursos'

  @IsOptional()
  @IsString()
  operacion?: string; // Ej: 'CREATE', 'UPDATE', 'DELETE'

  // Opcional: Filtro genérico (para buscar por ID de fila, etc.)
  @IsOptional()
  @IsString()
  search?: string;
}
