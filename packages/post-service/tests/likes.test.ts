import express from 'express';
import request from 'supertest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPostModel = {
  findById: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => ({
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

jest.mock('@breezy/shared/src/models/mongodb/Post', () => ({
  __esModule: true,
  default: mockPostModel,
}));

import likeRoutes from '../src/routes/likes';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts', likeRoutes);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Like Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('POST /api/posts/:id/like', () => {
    it('should like a post that has not been liked yet', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'post123',
        user_id: 2,
        likes: [] as number[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app).post('/api/posts/post123/like');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ liked: true, likesCount: 1 });
      expect(mockPost.likes).toContain(1);
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should unlike a post that was already liked (toggle)', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'post123',
        user_id: 2,
        likes: [1, 3, 5] as number[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app).post('/api/posts/post123/like');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ liked: false, likesCount: 2 });
      expect(mockPost.likes).not.toContain(1);
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should return 404 if the post does not exist', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findById.mockResolvedValue(null);

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
  });
});
