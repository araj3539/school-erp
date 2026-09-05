export interface ApiErrorPayload {
  error?: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}
