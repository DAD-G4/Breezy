import express from 'express';
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

jest.mock('@breezy/shared', () => ({
  UserModel: mockUserModel,
  ProfileModel: mockProfileModel,
  success: jest.fn((res: any, data: any, message?: string, statusCode?: number) => {
    const code = statusCode || 200;
    const body: any = { data };
    if (message) body.message = message;
    return res.status(code).json(body);
  }),
  error: jest.fn((res: any, errorMessage: string, statusCode: number) => {
    return res.status(statusCode).json({ error: errorMessage, statusCode });
  }),
}));

import authRoutes from '../src/routes/auth';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Auth Routes', () => {
  const app = buildApp();
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully (201)', async () => {
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
    it('should login successfully and return JWT (200)', async () => {
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
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();

      const decoded = jwt.verify(res.body.data.token, JWT_SECRET) as any;
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('user');

      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + 3600 + 10);

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
});
