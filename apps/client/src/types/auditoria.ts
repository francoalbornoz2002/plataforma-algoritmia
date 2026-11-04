import type { BaseFilterParams, PaginatedResponse } from "./common";

export interface LogAuditoria {
  id: string;
  tablaAfectada: string;
  idFilaAfectada: string;
  operacion: string;
  idUsuarioModifico: string | null;
  fechaHora: string;
  valoresAnteriores: any;
  valoresNuevos: any;
  usuarioModifico: {
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

// 2. Para los parámetros del servicio (los filtros)
export interface FindLogsParams extends BaseFilterParams {
  fechaDesde?: string;
  fechaHasta?: string;
  tablaAfectada?: string;
  operacion?: string;
  search?: string;
}

// 3. Para la respuesta paginada de la API
export interface PaginatedLogsResponse
  extends PaginatedResponse<LogAuditoria> {}
