// src/courses/dto/find-all-courses.dto.ts
import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Define allowed sort orders
enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindAllCoursesDto {
  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  @Type(() => Number) // Transform string query param to number
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser al menos 1.' })
  @Type(() => Number)
  limit?: number = 10; // Default limit per page

  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser texto.' })
  sort?: string = 'nombre'; // Default sort field

  @IsOptional()
  @IsEnum(SortOrder, { message: 'El orden debe ser "asc" o "desc".' })
  order?: 'asc' | 'desc' = 'asc'; // Default sort order

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto.' })
  search?: string; // For searching by course name

  // You can add more filters here later (e.g., filter by teacher ID)
  // @IsOptional()
  // @IsUUID()
  // teacherId?: string;
}
