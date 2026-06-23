import express from 'express';
import request from 'supertest';

const mockPostModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
};

jest.mock('@breezy/shared/src/models/mongodb/Post', () => ({
  __esModule: true,
  default: mockPostModel,
}));

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    PostModel: mockPostModel,
    success: jest.fn((res: any, data: any) => {
      return res.status(200).json({ data });
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
    Ban: { findOne: jest.fn().mockResolvedValue(null) },
  };
});

import tagRoutes from '../src/routes/tags';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tags', tagRoutes);
  return app;
}

describe('Tag Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = { id: 1, username: 'user1', email: 'user1@test.com', role: 'user' };
  });

  describe('GET /api/tags/search', () => {
    it('should return posts matching the search tag', async () => {
      const mockPosts = [
        { _id: '1', content: 'Hello #javascript', tags: ['javascript'], created_at: '2024-01-02T00:00:00.000Z' },
        { _id: '2', content: 'JS tips #javascript', tags: ['javascript'], created_at: '2024-01-01T00:00:00.000Z' },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockPosts);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/tags/search?q=javascript');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual(mockPosts);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(mockPostModel.find).toHaveBeenCalledWith({ tags: 'javascript' });
    });

    it('should perform case-insensitive search', async () => {
      const mockPosts = [
        { _id: '1', content: 'Hello #JavaScript', tags: ['javascript'], created_at: '2024-01-02T00:00:00.000Z' },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockPosts);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/tags/search?q=JavaScript');

      expect(res.status).toBe(200);
      // The controller lowercases the query before searching
      expect(mockPostModel.find).toHaveBeenCalledWith({ tags: 'javascript' });
      expect(res.body.data.posts).toEqual(mockPosts);
    });

    it('should return empty results for non-existent tag', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/tags/search?q=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
      expect(res.body.data.pagination.totalPages).toBe(0);
    });
  });
});
