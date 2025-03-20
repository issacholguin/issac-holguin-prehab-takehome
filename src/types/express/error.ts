// Custom error interface
export interface AppError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
}
