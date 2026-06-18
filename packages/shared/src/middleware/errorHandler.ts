import { Request, Response, NextFunction } from 'express';

// ── Custom error classes for known error types ──────────────────────────────

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// ── Error shape returned to the client ───────────────────────────────────────

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

// ── Global error-handling middleware ─────────────────────────────────────────

/**
 * Express error-handling middleware.
 * Must be registered last: app.use(errorHandler)
 *
 * Handles:
 *  - SequelizeValidationError  → 400
 *  - Mongoose ValidationError   → 400
 *  - jsonwebtoken JsonWebTokenError → 401
 *  - jsonwebtoken TokenExpiredError → 401
 *  - AppError (custom)          → uses error.statusCode
 *  - Unknown errors             → 500
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Log in development only
  if (isDev) {
    console.error('[ErrorHandler]', err);
  }

  // ── Sequelize validation errors ──────────────────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    const sequelizeErr = err as any;
    const message = sequelizeErr.errors
      ? sequelizeErr.errors.map((e: any) => e.message).join(', ')
      : 'Validation failed';
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  // ── Sequelize unique constraint errors ───────────────────────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    const sequelizeErr = err as any;
    const message = sequelizeErr.errors
      ? sequelizeErr.errors.map((e: any) => e.message).join(', ')
      : 'Resource already exists';
    res.status(409).json({ error: message, statusCode: 409 });
    return;
  }

  // ── Mongoose validation errors ───────────────────────────────────────────
  if (err.name === 'ValidationError' && 'errors' in err) {
    const mongooseErr = err as any;
    const message = Object.values(mongooseErr.errors)
      .map((e: any) => e.message)
      .join(', ');
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  // ── Mongoose cast errors (invalid ObjectId, etc.) ────────────────────────
  if (err.name === 'CastError') {
    const castErr = err as any;
    const message = `Invalid ${castErr.path}: ${castErr.value}`;
    res.status(400).json({ error: message, statusCode: 400 });
    return;
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token.', statusCode: 401 });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired.', statusCode: 401 });
    return;
  }

  // ── Custom AppError ──────────────────────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, statusCode: err.statusCode });
    return;
  }

  // ── Fallback: unknown error ──────────────────────────────────────────────
  res.status(500).json({ error: 'Internal server error.', statusCode: 500 });
}

export default errorHandler;
