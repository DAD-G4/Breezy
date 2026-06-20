import express from 'express';
import request from 'supertest';

jest.mock('../config/connection', () => ({
  sequelize: { authenticate: jest.fn() },
}));
jest.mock('mongoose', () => ({
  default: { connection: { readyState: 1 } },
  __esModule: true,
}));

import healthRouter from '../routes/health';
import { sequelize } from '../config/connection';
import mongoose from 'mongoose';

const app = express();
app.use('/api/health', healthRouter);

describe('GET /api/health', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when both databases are connected', async () => {
    (sequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
    (mongoose as any).connection.readyState = 1;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      postgres: 'connected',
      mongodb: 'connected',
    });
  });

  it('returns 503 when postgres is down', async () => {
    (sequelize.authenticate as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    (mongoose as any).connection.readyState = 1;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'degraded',
      postgres: 'disconnected',
      mongodb: 'connected',
    });
  });

  it('returns 503 when mongodb is down', async () => {
    (sequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
    (mongoose as any).connection.readyState = 0;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'degraded',
      postgres: 'connected',
      mongodb: 'disconnected',
    });
  });
});
