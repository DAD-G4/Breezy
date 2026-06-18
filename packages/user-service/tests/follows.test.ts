import express from 'express';
import request from 'supertest';

const mockFollowerModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => ({
  Follower: mockFollowerModel,
  success: jest.fn((res: any, data: any, message?: string, statusCode?: number) => {
    const code = statusCode || 200;
    const body: any = { data };
    if (message) body.message = message;
    return res.status(code).json(body);
  }),
  error: jest.fn((res: any, errorMessage: string, statusCode: number) => {
    return res.status(statusCode).json({ error: errorMessage, statusCode });
  }),
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    if (mockAuthenticatedUser) {
      req.user = { ...mockAuthenticatedUser };
      next();
    } else {
      res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  }),
}));

import followRoutes from '../src/routes/follows';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', followRoutes);
  return app;
}

describe('Follow Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('POST /api/users/follow/:id', () => {
    it('should follow a user successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findOne.mockResolvedValue(null);
      mockFollowerModel.create.mockResolvedValue({
        id: 1,
        follower_id: 1,
        following_id: 2,
        created_at: new Date(),
      });

      const res = await request(app).post('/api/users/follow/2');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully followed user');
      expect(res.body.data.follower_id).toBe(1);
      expect(res.body.data.following_id).toBe(2);
      expect(mockFollowerModel.findOne).toHaveBeenCalledWith({
        where: { follower_id: 1, following_id: 2 },
      });
      expect(mockFollowerModel.create).toHaveBeenCalledWith({
        follower_id: 1,
        following_id: 2,
      });
    });

    it('should return 400 when trying to follow yourself', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app).post('/api/users/follow/1');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot follow yourself');
      expect(mockFollowerModel.create).not.toHaveBeenCalled();
    });

    it('should return 409 when already following', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findOne.mockResolvedValue({
        id: 1,
        follower_id: 1,
        following_id: 2,
        created_at: new Date(),
      });

      const res = await request(app).post('/api/users/follow/2');

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Already following');
      expect(mockFollowerModel.create).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).post('/api/users/follow/2');

      expect(res.status).toBe(401);
    });

    it('should return 409 on UniqueConstraintError (race condition)', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findOne.mockResolvedValue(null);
      const uniqueError = new Error('Unique constraint violation');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      mockFollowerModel.create.mockRejectedValue(uniqueError);

      const res = await request(app).post('/api/users/follow/2');

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Already following');
    });

    it('should return 500 on unexpected database error', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findOne.mockRejectedValue(new Error('DB connection failed'));

      const res = await request(app).post('/api/users/follow/2');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/users/unfollow/:id', () => {
    it('should unfollow a user successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.destroy.mockResolvedValue(1);

      const res = await request(app).delete('/api/users/unfollow/2');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully unfollowed user');
      expect(mockFollowerModel.destroy).toHaveBeenCalledWith({
        where: { follower_id: 1, following_id: 2 },
      });
    });

    it('should return 404 if not following the user', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.destroy.mockResolvedValue(0);

      const res = await request(app).delete('/api/users/unfollow/2');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not following this user');
    });

    it('should return 401 if no token provided', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).delete('/api/users/unfollow/2');

      expect(res.status).toBe(401);
    });

    it('should return 500 on unexpected database error', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.destroy.mockRejectedValue(new Error('DB connection failed'));

      const res = await request(app).delete('/api/users/unfollow/2');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
