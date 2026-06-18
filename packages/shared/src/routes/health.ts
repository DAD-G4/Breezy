import { Router, Request, Response } from 'express';
import { sequelize } from '../config/connection';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 *
 * Pings PostgreSQL and MongoDB, returning their connection status.
 * Returns 200 when both are reachable, 503 if either is down.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  let postgresStatus = 'disconnected';
  let mongodbStatus = 'disconnected';

  try {
    await sequelize.authenticate();
    postgresStatus = 'connected';
  } catch {
    postgresStatus = 'disconnected';
  }

  try {
    if (mongoose.connection.readyState === 1) {
      mongodbStatus = 'connected';
    }
  } catch {
    mongodbStatus = 'disconnected';
  }

  const allHealthy =
    postgresStatus === 'connected' && mongodbStatus === 'connected';

  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'ok' : 'degraded',
    postgres: postgresStatus,
    mongodb: mongodbStatus,
  });
});

export default router;
