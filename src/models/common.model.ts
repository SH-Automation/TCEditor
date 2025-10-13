export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
  warningLevel: 'error' | 'warning' | 'info';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface EntityTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityWithId {
  id: string;
}

export type Entity = EntityWithId & EntityTimestamps;
