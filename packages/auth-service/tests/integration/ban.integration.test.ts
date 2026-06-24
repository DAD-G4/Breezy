import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first — sets env vars before any imports

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectTestDatabases, disconnectTestDatabases, clearAllTestData } from '@breezy/shared/src/test-utils';
import { sequelize, UserModel, Ban } from '@breezy/shared';
import authRoutes from '../../src/routes/auth';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
}

beforeAll(async () => {
  await connectTestDatabases();
  await sequelize.sync({ force: true }); // Create tables
});

afterAll(async () => {
  await disconnectTestDatabases();
});

beforeEach(async () => {
  await clearAllTestData(); // Clean between tests
});

describe('Ban-at-login Integration Tests', () => {
  const app = buildApp();

  const userCredentials = {
    email: 'banned@example.com',
    username: 'banneduser',
    password: 'securePass123',
  };

  beforeEach(async () => {
    // Register a user before each test.
    await request(app)
      .post('/api/auth/register')
      .send(userCredentials)
      .expect(201);
  });

  it('should return 403 when a user with an active permanent ban tries to log in', async () => {
    const user = await UserModel.findOne({ where: { email: userCredentials.email } });
    expect(user).not.toBeNull();

    // Permanent ban (no expiry).
    await Ban.create({
      user_id: user!.id,
      reason: 'Violation of terms',
      banned_by: user!.id,
      expires_at: null,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: userCredentials.password })
      .expect(403);

    expect(res.body).toHaveProperty('error');
    // No auth cookies should be set for a banned user.
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('should return 403 when a user with a non-expired temporary ban tries to log in', async () => {
    const user = await UserModel.findOne({ where: { email: userCredentials.email } });
    expect(user).not.toBeNull();

    // Temporary ban expiring in the future → still active.
    await Ban.create({
      user_id: user!.id,
      reason: 'Temporary suspension',
      banned_by: user!.id,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: userCredentials.password })
      .expect(403);
  });

  it('should log in normally (200) when the user has no ban', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: userCredentials.password })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body.data.user.email).toBe(userCredentials.email);

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie).toBeDefined();
    expect(setCookie.some((c: string) => c.startsWith('accessToken='))).toBe(true);
  });

  it('should log in normally (200) when the user has an expired ban', async () => {
    const user = await UserModel.findOne({ where: { email: userCredentials.email } });
    expect(user).not.toBeNull();

    // Ban already expired in the past → login allowed.
    await Ban.create({
      user_id: user!.id,
      reason: 'Old suspension',
      banned_by: user!.id,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: userCredentials.password })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Login successful');
  });
});
