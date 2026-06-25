import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockProfileModel = {
  create: jest.fn(),
};

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    UserModel: mockUserModel,
    ProfileModel: mockProfileModel,
    // Ban-at-login check: login() queries Ban.findOne. Default: no ban.
    // Stub it so the unit test never hits a real Postgres connection.
    Ban: { findOne: jest.fn().mockResolvedValue(null) },
    getJwtSecret: jest.fn(() => process.env.JWT_SECRET || 'default-secret'),
    success: jest.fn((res: any, data: any, message?: string, statusCode?: number) => {
      const code = statusCode || 200;
      const body: any = { data };
      if (message) body.message = message;
      return res.status(code).json(body);
    }),
    error: jest.fn((res: any, errorMessage: string, statusCode: number) => {
      return res.status(statusCode).json({ error: errorMessage, statusCode });
    }),
  };
});

import authRoutes from '../src/routes/auth';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
}

function extractCookie(res: request.Response, name: string): string | undefined {
  const setCookie: string[] = (res.headers as any)['set-cookie'];
  if (!setCookie) return undefined;
  const match = setCookie.find((c: string) => c.startsWith(`${name}=`));
  if (!match) return undefined;
  return match.split(';')[0].split('=')[1];
}

describe('Auth Routes', () => {
  const app = buildApp();
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and set auth cookies (201)', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        role: 'user',
      });
      mockProfileModel.create.mockResolvedValue({ id: 1, user_id: 1 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created successfully');

      expect(mockUserModel.findOne).toHaveBeenCalledTimes(2);

      expect(mockUserModel.create).toHaveBeenCalledTimes(1);
      const createCall = mockUserModel.create.mock.calls[0][0];
      expect(createCall.email).toBe('test@test.com');
      expect(createCall.username).toBe('testuser');
      expect(createCall.password_hash).not.toBe('SecurePass123!');

      expect(mockProfileModel.create).toHaveBeenCalledTimes(1);
      expect(mockProfileModel.create.mock.calls[0][0].user_id).toBe(1);

      const accessToken = extractCookie(res, 'accessToken');
      expect(accessToken).toBeDefined();
      const decoded = jwt.verify(accessToken!, JWT_SECRET) as any;
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');

      const refreshToken = extractCookie(res, 'refreshToken');
      expect(refreshToken).toBeDefined();

      expect(res.body.data.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'user',
      });
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          username: 'testuser',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('should return 400 for short username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'ab',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Username');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password');
    });
  });

  describe('POST /api/auth/register - duplicate email', () => {
    it('should return 409 Conflict for duplicate email', async () => {
      mockUserModel.findOne.mockResolvedValueOnce({
        id: 99,
        email: 'test@test.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already in use');
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and set auth cookies (200)', async () => {
      const passwordHash = await bcrypt.hash('SecurePass123!', 10);
      mockUserModel.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password_hash: passwordHash,
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(200);

      const accessToken = extractCookie(res, 'accessToken');
      expect(accessToken).toBeDefined();

      const decoded = jwt.verify(accessToken!, JWT_SECRET) as any;
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('user');

      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + 3600 + 10);

      const refreshToken = extractCookie(res, 'refreshToken');
      expect(refreshToken).toBeDefined();

      expect(res.body.data.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'user',
      });
    });

    it('should return 401 for non-existent email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'SecurePass123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login - wrong password', () => {
    it('should return 401 Unauthorized for wrong password', async () => {
      const passwordHash = await bcrypt.hash('SecurePass123!', 10);
      mockUserModel.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password_hash: passwordHash,
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
      expect(res.body.data).toBeUndefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for valid accessToken cookie', async () => {
      const token = jwt.sign(
        { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `accessToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'user',
      });
    });

    it('should return 401 when no cookie is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      const token = jwt.sign(
        { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `accessToken=${token}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear auth cookies', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      const setCookie: string[] = (res.headers as any)['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.startsWith('accessToken=;'))).toBe(true);
      expect(setCookie.some((c: string) => c.startsWith('refreshToken=;'))).toBe(true);
    });
  });
});
