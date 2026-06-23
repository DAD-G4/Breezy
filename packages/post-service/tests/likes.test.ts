import express from 'express';
import request from 'supertest';

const mockPostModel = {
  findOneAndUpdate: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

const mockNotificationModel = {
  findOneAndUpdate: jest.fn().mockResolvedValue(true),
};

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    PostModel: mockPostModel,
    NotificationModel: mockNotificationModel,
    Ban: { findOne: jest.fn().mockResolvedValue(null) },
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
    checkBan: jest.fn((_banChecker: any) => (req: any, _res: any, next: any) => next()),
  };
});

import likeRoutes from '../src/routes/likes';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts', likeRoutes);
  return app;
}

const togglePipeline = (userId: number) => [{
  $set: {
    likes: {
      $cond: {
        if: { $in: [userId, '$likes'] },
        then: { $setDifference: ['$likes', [userId]] },
        else: { $setUnion: ['$likes', [userId]] },
      },
    },
  },
}];

describe('Like Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
    mockPostModel.findOneAndUpdate.mockReset();
    mockNotificationModel.findOneAndUpdate.mockReset();
    mockNotificationModel.findOneAndUpdate.mockResolvedValue(true);
  });

  describe('POST /api/posts/:id/like', () => {
    it('should like a post that has not been liked yet', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue({
        _id: 'post123',
        user_id: 2,
        likes: [1],
      });

      const res = await request(app).post('/api/posts/post123/like');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ liked: true, likesCount: 1 });
      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'post123' },
        togglePipeline(1),
        { new: true, updatePipeline: true },
      );
    });

    it('should unlike a post that was already liked (toggle)', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue({
        _id: 'post123',
        user_id: 2,
        likes: [3, 5],
      });

      const res = await request(app).post('/api/posts/post123/like');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ liked: false, likesCount: 2 });
      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'post123' },
        togglePipeline(1),
        { new: true, updatePipeline: true },
      );
    });

    it('should return 404 if the post does not exist', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).post('/api/posts/nonexistent/like');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
      expect(res.body.statusCode).toBe(404);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).post('/api/posts/post123/like');

      expect(res.status).toBe(401);
    });

    it('should create a notification when a user likes another user\'s post', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue({
        _id: 'post123',
        user_id: 2,
        likes: [1],
      });

      await request(app).post('/api/posts/post123/like');

      expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          recipient_id: 2,
          sender_id: 1,
          type: 'like',
          post_id: 'post123',
        },
        {
          $setOnInsert: {
            recipient_id: 2,
            sender_id: 1,
            type: 'like',
            post_id: 'post123',
            is_read: false,
          },
        },
        { upsert: true },
      );
    });

    it('should not create a notification when a user likes their own post', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue({
        _id: 'post123',
        user_id: 1,
        likes: [1],
      });

      await request(app).post('/api/posts/post123/like');

      expect(mockNotificationModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should not create a notification when unliking a post', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findOneAndUpdate.mockResolvedValue({
        _id: 'post123',
        user_id: 2,
        likes: [],
      });

      await request(app).post('/api/posts/post123/like');

      expect(mockNotificationModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
