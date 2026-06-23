import express from 'express';
import request from 'supertest';

const mockPostModel = {
  findById: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    PostModel: mockPostModel,
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

import commentRoutes from '../src/routes/comments';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts', commentRoutes);
  return app;
}

describe('Comment Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('POST /api/posts/:id/comment', () => {
    it('should add a comment successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockComments: any[] = [];
      const mockPost = {
        _id: 'post123',
        user_id: 2,
        content: 'Original post',
        comments: mockComments,
        save: jest.fn().mockResolvedValue(true),
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app)
        .post('/api/posts/post123/comment')
        .send({ content: 'Great post!' });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe('Great post!');
      expect(res.body.data.user_id).toBe(1);
      expect(res.body.data.replies).toEqual([]);
      expect(res.body.message).toBe('Comment added successfully');
      expect(mockComments).toHaveLength(1);
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should return 400 if content is empty', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/posts/post123/comment')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
    });

    it('should return 400 if content is missing', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/posts/post123/comment')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
    });

    it('should return 404 if post not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/posts/nonexistent/comment')
        .send({ content: 'Nice!' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });
  });

  describe('POST /api/posts/:id/comment/:commentId/reply', () => {
    it('should reply to a comment successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const commentId = 'comment456';
      const mockReplies: any[] = [];
      const mockComments = [
        {
          comment_id: { toString: () => commentId },
          user_id: 2,
          content: 'Original comment',
          replies: mockReplies,
        },
      ];
      const mockPost = {
        _id: 'post123',
        user_id: 2,
        content: 'Original post',
        comments: mockComments,
        save: jest.fn().mockResolvedValue(true),
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app)
        .post(`/api/posts/post123/comment/${commentId}/reply`)
        .send({ content: 'I agree!' });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe('I agree!');
      expect(res.body.data.user_id).toBe(1);
      expect(res.body.message).toBe('Reply added successfully');
      expect(mockReplies).toHaveLength(1);
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should return 404 if comment not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'post123',
        user_id: 2,
        content: 'Original post',
        comments: [],
        save: jest.fn(),
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app)
        .post('/api/posts/post123/comment/nonexistent/reply')
        .send({ content: 'Reply here' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Comment not found');
      expect(mockPost.save).not.toHaveBeenCalled();
    });

    it('should return 400 if reply content is empty', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/posts/post123/comment/comment456/reply')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
    });

    it('should return 404 if post not found for reply', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/posts/nonexistent/comment/comment456/reply')
        .send({ content: 'Reply' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
    });
  });
});
