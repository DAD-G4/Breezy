import { Request, Response, NextFunction } from 'express';

/**
 * Catch-all middleware for undefined routes.
 * Must be registered after all other routes.
 */
function notFound(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({ error: 'Route not found', statusCode: 404 });
}

export default notFound;
