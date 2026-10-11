export interface ApiResponse<T> {
  message: string;
  statusCode: number;
  error: boolean;
  data: T;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

/** Campo → mensajes, en `data` de una respuesta 422. */
export type ValidationErrors = Record<string, string[]>;
