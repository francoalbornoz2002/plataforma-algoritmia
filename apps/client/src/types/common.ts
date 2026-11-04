import React from "react";

export interface MenuItemType {
  text: string;
  icon: React.ReactElement; // Para aceptar JSX como <DashboardIcon />
  path: string;
}

// Interfaz base para los parámetros de búsqueda y filtros
export interface BaseFilterParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

// Interfaz base para la respuesta paginada de la API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
