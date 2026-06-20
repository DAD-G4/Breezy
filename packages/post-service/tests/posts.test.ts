import express from 'express';
import request from 'supertest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPostModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

const mockUserModel = {
  findOne: jest.fn(),
};

const mockNotificationModel = {
  create: jest.fn(),
};

jest.mock('@breezy/shared', () => ({
  PostModel: mockPostModel,
  UserModel: mockUserModel,
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
}));

import postRoutes from '../src/routes/posts';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts', postRoutes);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Post Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
    mockUserModel.findOne.mockReset();
    mockNotificationModel.create.mockReset();
  });

  describe('POST /api/posts', () => {
    it('should create a post successfully with hashtags extracted', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Hello #world! This is my first #post',
        tags: ['world', 'post'],
        likes: [],
        comments: [],
        media: null,
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);

      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Hello #world! This is my first #post' });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe('Hello #world! This is my first #post');
      expect(res.body.data.tags).toEqual(['world', 'post']);
      expect(res.body.message).toBe('Post created successfully');
      expect(mockPostModel.create).toHaveBeenCalledWith({
        user_id: 1,
        content: 'Hello #world! This is my first #post',
        tags: ['world', 'post'],
        media: null,
      });
    });

    it('should create a post with media', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc124',
        user_id: 1,
        content: 'Check out this photo #photography',
        tags: ['photography'],
        likes: [],
        comments: [],
        media: { type: 'image', url: 'https://example.com/photo.jpg' },
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);

      const res = await request(app)
        .post('/api/posts')
        .send({
          content: 'Check out this photo #photography',
          media: { type: 'image', url: 'https://example.com/photo.jpg' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.media).toEqual({ type: 'image', url: 'https://example.com/photo.jpg' });
      expect(mockPostModel.create).toHaveBeenCalledWith({
        user_id: 1,
        content: 'Check out this photo #photography',
        tags: ['photography'],
        media: { type: 'image', url: 'https://example.com/photo.jpg' },
      });
    });

    it('should return 400 if content exceeds 280 characters', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const longContent = 'a'.repeat(281);

      const res = await request(app)
        .post('/api/posts')
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content cannot exceed 280 characters');
      expect(mockPostModel.create).not.toHaveBeenCalled();
    });

    it('should return 400 if content is missing', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/posts')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
      expect(mockPostModel.create).not.toHaveBeenCalled();
    });

    it('should return 400 if content is empty string', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/posts')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
      expect(mockPostModel.create).not.toHaveBeenCalled();
    });

    it('should deduplicate hashtags and lowercase them', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc125',
        user_id: 1,
        content: '#Hello #hello #HELLO world',
        tags: ['hello'],
        likes: [],
        comments: [],
        media: null,
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);

      const res = await request(app)
        .post('/api/posts')
        .send({ content: '#Hello #hello #HELLO world' });

      expect(res.status).toBe(201);
      expect(mockPostModel.create).toHaveBeenCalledWith({
        user_id: 1,
        content: '#Hello #hello #HELLO world',
        tags: ['hello'],
        media: null,
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Hello world' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/user/:id', () => {
    it('should return user posts with default pagination', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPosts = [
        { _id: '1', user_id: 2, content: 'Post 1', created_at: '2024-01-02T00:00:00.000Z' },
        { _id: '2', user_id: 2, content: 'Post 2', created_at: '2024-01-01T00:00:00.000Z' },
      ];

      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockPosts),
        }),
      });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/posts/user/2');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual(mockPosts);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should support custom pagination params', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPosts = [
        { _id: '3', user_id: 2, content: 'Post 3', created_at: new Date('2024-01-03') },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockPosts);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(25);

      const res = await request(app).get('/api/posts/user/2?page=2&limit=10');

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

    it('should sort posts by created_at descending', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/posts/user/2');

      expect(sortMock).toHaveBeenCalledWith({ created_at: -1 });
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/posts/user/2');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete own post successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'My post to delete',
      };

      mockPostModel.findById.mockResolvedValue(mockPost);
      mockPostModel.findByIdAndDelete.mockResolvedValue(mockPost);

      const res = await request(app).delete('/api/posts/abc123');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ deleted: true });
      expect(res.body.message).toBe('Post deleted successfully');
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith('abc123');
    });

    it('should return 403 if not the owner', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'abc123',
        user_id: 2,
        content: 'Someone else post',
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app).delete('/api/posts/abc123');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
      expect(mockPostModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return 404 if post not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findById.mockResolvedValue(null);

      const res = await request(app).delete('/api/posts/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
      expect(mockPostModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).delete('/api/posts/abc123');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update a post successfully and re-extract tags when content changes', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const existingPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Old content',
        tags: [],
      };

      const updatedPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Updated #content here',
        tags: ['content'],
      };

      mockPostModel.findById.mockResolvedValue(existingPost);
      mockPostModel.findByIdAndUpdate.mockResolvedValue(updatedPost);

      const res = await request(app)
        .put('/api/posts/abc123')
        .send({ content: 'Updated #content here' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated #content here');
      expect(res.body.data.tags).toEqual(['content']);
      expect(res.body.message).toBe('Post updated successfully');
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'abc123',
        { content: 'Updated #content here', tags: ['content'] },
        { new: true }
      );
    });

    it('should update a post without re-extracting tags if content unchanged', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const existingPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Same content',
        tags: ['old'],
      };

      const updatedPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Same content',
        tags: ['old'],
      };

      mockPostModel.findById.mockResolvedValue(existingPost);
      mockPostModel.findByIdAndUpdate.mockResolvedValue(updatedPost);

      const res = await request(app)
        .put('/api/posts/abc123')
        .send({ content: 'Same content' });

      expect(res.status).toBe(200);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'abc123',
        { content: 'Same content' },
        { new: true }
      );
    });

    it('should return 403 if not the owner', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockPost = {
        _id: 'abc123',
        user_id: 2,
        content: 'Someone else post',
      };

      mockPostModel.findById.mockResolvedValue(mockPost);

      const res = await request(app)
        .put('/api/posts/abc123')
        .send({ content: 'Trying to update' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 404 if post not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockPostModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/posts/nonexistent')
        .send({ content: 'Hello' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found');
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 400 if content exceeds 280 characters', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const longContent = 'a'.repeat(281);

      const res = await request(app)
        .put('/api/posts/abc123')
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content cannot exceed 280 characters');
      expect(mockPostModel.findById).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app)
        .put('/api/posts/abc123')
        .send({ content: 'Hello' });

      expect(res.status).toBe(401);
    });
  });

  describe('Mention notifications', () => {
    it('should create notifications for mentioned users on post creation', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc123',
        user_id: 1,
        content: 'Hello @bob and @charlie!',
        tags: [],
        likes: [],
        comments: [],
        media: null,
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);

      mockUserModel.findOne
        .mockResolvedValueOnce({ id: 2, username: 'bob' })
        .mockResolvedValueOnce({ id: 3, username: 'charlie' });

      mockNotificationModel.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Hello @bob and @charlie!' });

      expect(res.status).toBe(201);
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ where: { username: 'bob' } });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ where: { username: 'charlie' } });
      expect(mockNotificationModel.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        recipient_id: 2,
        sender_id: 1,
        type: 'mention',
        post_id: 'abc123',
        is_read: false,
      });
      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        recipient_id: 3,
        sender_id: 1,
        type: 'mention',
        post_id: 'abc123',
        is_read: false,
      });
    });

    it('should not create notification for self-mentions', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc124',
        user_id: 1,
        content: 'Hello @alice!',
        tags: [],
        likes: [],
        comments: [],
        media: null,
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);
      mockUserModel.findOne.mockResolvedValue({ id: 1, username: 'alice' });

      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Hello @alice!' });

      expect(res.status).toBe(201);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ where: { username: 'alice' } });
      expect(mockNotificationModel.create).not.toHaveBeenCalled();
    });

    it('should skip notification if mentioned user not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const createdPost = {
        _id: 'abc125',
        user_id: 1,
        content: 'Hello @ghost!',
        tags: [],
        likes: [],
        comments: [],
        media: null,
        created_at: new Date(),
      };

      mockPostModel.create.mockResolvedValue(createdPost);
      mockUserModel.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Hello @ghost!' });

      expect(res.status).toBe(201);
      expect(mockNotificationModel.create).not.toHaveBeenCalled();
    });
  });
});
