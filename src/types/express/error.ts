// Custom error interface
export interface AppError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
}

export class AppError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
