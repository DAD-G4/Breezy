import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first — sets env vars before any imports

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { connectTestDatabases, disconnectTestDatabases, clearAllTestData } from '@breezy/shared/src/test-utils';
import { sequelize, UserModel } from '@breezy/shared';
import authRoutes from '../../src/routes/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
}

function extractCookie(res: request.Response, name: string): string | undefined {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return undefined;
  const match = setCookie.find((c: string) => c.startsWith(`${name}=`));
  if (!match) return undefined;
  return match.split(';')[0].split('=')[1];
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

describe('Auth Integration Tests', () => {
  const app = buildApp();

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'securePass123',
    };

    it('should register a new user, set auth cookies, and return user data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'User created successfully');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.username).toBe(validUser.username);

      const accessToken = extractCookie(res, 'accessToken');
      expect(accessToken).toBeDefined();
      const decoded = jwt.verify(accessToken!, JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.email).toBe(validUser.email);

      const refreshToken = extractCookie(res, 'refreshToken');
      expect(refreshToken).toBeDefined();

      // Verify user exists in real PostgreSQL
      const userInDb = await UserModel.findOne({ where: { email: validUser.email } });
      expect(userInDb).not.toBeNull();
      expect(userInDb!.email).toBe(validUser.email);
      expect(userInDb!.username).toBe(validUser.username);
      expect(userInDb!.role).toBe('user');
      expect(userInDb!.password_hash).not.toBe(validUser.password); // Must be hashed
    });

    it('should return 409 when registering with duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Try registering with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, username: 'differentuser' })
        .expect(409);

      expect(res.body).toHaveProperty('error', 'Email already in use');
    });

    it('should return 409 when registering with duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Try registering with same username
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'other@example.com' })
        .expect(409);

      expect(res.body).toHaveProperty('error', 'Username already in use');
    });

    it('should return 400 when registering with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Email is required');
      expect(res.body.error).toContain('Username is required');
      expect(res.body.error).toContain('Password is required');
    });

    it('should return 400 when registering with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Invalid email format');
    });

    it('should return 400 when registering with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'short' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Password must be at least 8 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    const userCredentials = {
      email: 'login@example.com',
      username: 'loginuser',
      password: 'securePass123',
    };

    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post('/api/auth/register')
        .send(userCredentials)
        .expect(201);
    });

    it('should login with correct credentials and set auth cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userCredentials.email, password: userCredentials.password })
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body.data).toHaveProperty('user');

      const { user } = res.body.data;
      expect(user.email).toBe(userCredentials.email);
      expect(user.username).toBe(userCredentials.username);
      expect(user.role).toBe('user');

      const accessToken = extractCookie(res, 'accessToken');
      expect(accessToken).toBeDefined();

      const decoded = jwt.verify(accessToken!, JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(userCredentials.email);
      expect(decoded.username).toBe(userCredentials.username);
      expect(decoded.role).toBe('user');
    });

    it('should return 401 when logging in with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userCredentials.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 when logging in with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'somepassword' })
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data from valid cookie', async () => {
      // Register and login to get a cookie
      const userCredentials = {
        email: 'me@example.com',
        username: 'meuser',
        password: 'securePass123',
      };

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(userCredentials)
        .expect(201);

      const accessToken = extractCookie(registerRes, 'accessToken');
      expect(accessToken).toBeDefined();

      // Use cookie to get user data
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(meRes.body.data.user.email).toBe(userCredentials.email);
      expect(meRes.body.data.user.username).toBe(userCredentials.username);
    });

    it('should return 401 without a cookie', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear auth cookies', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      const setCookie = res.headers['set-cookie'] as string[];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.startsWith('accessToken=;'))).toBe(true);
      expect(setCookie.some((c: string) => c.startsWith('refreshToken=;'))).toBe(true);
    });
  });
});
