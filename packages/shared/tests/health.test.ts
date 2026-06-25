import express from 'express';
import request from 'supertest';

jest.mock('../src/config/connection', () => ({
  sequelize: { authenticate: jest.fn() },
}));
jest.mock('mongoose', () => ({
  default: { connection: { readyState: 1 } },
  __esModule: true,
}));

import healthRouter from '../src/routes/health';
import { sequelize } from '../src/config/connection';
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

  it('returns 503 when mongodb connection is broken (in use but not connected)', async () => {
    (sequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
    // readyState 2 = connecting / 3 = disconnecting → a service that uses
    // Mongo but currently has no live connection is reported unhealthy.
    (mongoose as any).connection.readyState = 2;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'degraded',
      postgres: 'connected',
      mongodb: 'disconnected',
    });
  });

  it('returns 200 when mongodb is not used (postgres-only service)', async () => {
    (sequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
    // readyState 0 = never connected → the service does not use Mongo, so it
    // must NOT cause a false 503 (see "report mongo as not_used" fix).
    (mongoose as any).connection.readyState = 0;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      postgres: 'connected',
      mongodb: 'not_used',
    });
  });
});
