import express from 'express';
import request from 'supertest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPostModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
};

const mockFollowerModel = {
  findAll: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared/src/models/mongodb/Post', () => mockPostModel);

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

import feedRoutes from '../src/routes/feed';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts/feed', feedRoutes);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feed Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('GET /api/posts/feed', () => {
    it('should return feed with posts from followed users', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findAll.mockResolvedValue([
        { following_id: 2 },
        { following_id: 3 },
      ]);

      const mockPosts = [
        { _id: '1', user_id: 2, content: 'Hello from bob', created_at: '2024-01-03T00:00:00.000Z' },
        { _id: '2', user_id: 3, content: 'Hello from carol', created_at: '2024-01-02T00:00:00.000Z' },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockPosts);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual(mockPosts);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(mockFollowerModel.findAll).toHaveBeenCalledWith({
        where: { follower_id: 1 },
        attributes: ['following_id'],
      });
      expect(mockPostModel.find).toHaveBeenCalledWith({ user_id: { $in: [2, 3] } });
    });

    it('should return posts in chronological order (newest first)', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findAll.mockResolvedValue([{ following_id: 2 }]);

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/posts/feed');

      expect(sortMock).toHaveBeenCalledWith({ created_at: -1 });
    });

    it('should support custom pagination params', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findAll.mockResolvedValue([{ following_id: 2 }]);

      const mockPosts = [
        { _id: '3', user_id: 2, content: 'Post 3', created_at: new Date('2024-01-03') },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockPosts);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(25);

      const res = await request(app).get('/api/posts/feed?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
      expect(skipMock).toHaveBeenCalledWith(10);
      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it('should return empty array when not following anyone', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockFollowerModel.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      expect(mockPostModel.find).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(401);
    });
  });
});
