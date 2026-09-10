export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Asegura que el stack trace pertenezca a la invocación real, excluyendo el constructor
    Error.captureStackTrace(this, this.constructor);
  }
}