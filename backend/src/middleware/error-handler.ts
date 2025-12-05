import { Context } from 'hono'
import { AppError } from '../utils/AppError'
import { ZodError } from 'zod'

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return c.json({
      status: 'error',
      message: err.message,
    }, err.statusCode);
  }

  if (err instanceof ZodError) {
    return c.json({
      status: 'fail',
      message: 'Validation Error',
      errors: err.errors,
    }, 400);
  }

  // Handle Prisma errors or other known types here if needed

  return c.json({
    status: 'error',
    message: 'Internal Server Error',
  }, 500);
}
