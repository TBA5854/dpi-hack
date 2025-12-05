import { ContentfulStatusCode } from 'hono/utils/http-status'

export class AppError extends Error {
  public statusCode: ContentfulStatusCode;
  public isOperational: boolean;

  constructor(message: string, statusCode: ContentfulStatusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
