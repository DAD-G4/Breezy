import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('[ErrorHandler]', err);
  }

  if (err.name === 'SequelizeValidationError') {
    const sequelizeErr = err as any;
    const message = sequelizeErr.errors
      ? sequelizeErr.errors.map((e: any) => e.message).join(', ')
      : 'Validation failed';
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const sequelizeErr = err as any;
    const message = sequelizeErr.errors
      ? sequelizeErr.errors.map((e: any) => e.message).join(', ')
      : 'Resource already exists';
    res.status(409).json({ error: message, statusCode: 409 });
    return;
  }

  if (err.name === 'ValidationError' && 'errors' in err) {
    const mongooseErr = err as any;
    const message = Object.values(mongooseErr.errors)
      .map((e: any) => e.message)
      .join(', ');
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  if (err.name === 'CastError') {
    const castErr = err as any;
    const message = `Invalid ${castErr.path}: ${castErr.value}`;
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token.', statusCode: 401 });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired.', statusCode: 401 });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, statusCode: err.statusCode });
    return;
  }

  res.status(500).json({ error: 'Internal server error.', statusCode: 500 });
}

export default errorHandler;
