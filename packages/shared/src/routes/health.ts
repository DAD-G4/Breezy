import { Router, Request, Response } from 'express';
import { sequelize } from '../config/connection';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 *
 * Pings PostgreSQL and reports MongoDB status based on the mongoose
 * connection state. PostgreSQL is required: if it is unreachable the
 * endpoint returns 503. MongoDB is only considered when a connection
 * actually exists for this service:
 *   - readyState 1 (connected)    -> healthy ("connected")
 *   - readyState 0 (never used)   -> skipped ("not_used"), not unhealthy
 *   - any other value             -> unhealthy ("disconnected")
 *
 * Returns 200 when Postgres is OK and Mongo is either healthy or not_used.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  let postgresStatus = 'disconnected';
  let mongodbStatus = 'not_used';

  try {
    await sequelize.authenticate();
    postgresStatus = 'connected';
  } catch {
    postgresStatus = 'disconnected';
  }

  const mongoReadyState = mongoose.connection.readyState;
  if (mongoReadyState === 1) {
    mongodbStatus = 'connected';
  } else if (mongoReadyState === 0) {
    mongodbStatus = 'not_used';
  } else {
    mongodbStatus = 'disconnected';
  }

  const postgresHealthy = postgresStatus === 'connected';
  const mongoHealthy =
    mongodbStatus === 'connected' || mongodbStatus === 'not_used';

  const allHealthy = postgresHealthy && mongoHealthy;
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'ok' : 'degraded',
    postgres: postgresStatus,
    mongodb: mongodbStatus,
  });
});

export default router;
