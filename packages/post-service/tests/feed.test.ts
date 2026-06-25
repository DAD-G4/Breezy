// Jest mocks must be hoisted - set up before any imports
jest.mock('@breezy/shared/src/models/mongodb/Post', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import { createMockSuccess, createMockError, createMockAuthenticateToken, createMockCheckBan, createMockBan } from '@breezy/shared/src/test-utils';
import PostModel from '@breezy/shared/src/models/mongodb/Post';

const mockPostModel = PostModel as any;

const mockFollowerModel = {
  findAll: jest.fn(),
};

const mockSuccess = createMockSuccess();
const mockError = createMockError();
const mockBan = createMockBan();
const mockAuthenticateToken = createMockAuthenticateToken();
const mockCheckBan = createMockCheckBan();

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    PostModel: mockPostModel,
    Follower: mockFollowerModel,
    Ban: mockBan,
    success: mockSuccess,
    error: mockError,
    authenticateToken: mockAuthenticateToken,
    checkBan: mockCheckBan,
  };
});

import feedRoutes from '../src/routes/feed';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts/feed', feedRoutes);
  return app;
}

describe('Feed Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateToken.setUser(null);
    mockFollowerModel.findAll.mockResolvedValue([]);
  });

  describe('GET /api/posts/feed', () => {
    it('should return feed posts with default pagination', async () => {
      mockAuthenticateToken.setUser({ id: 1, username: 'alice', email: 'alice@test.com', role: 'user' });

      mockFollowerModel.findAll.mockResolvedValue([
        { following_id: 2 },
        { following_id: 3 },
      ]);

      const mockPosts = [
        { _id: 'p1', user_id: 2, content: 'Hello world', likes: [], comments: [], created_at: '2024-01-01T00:00:00.000Z' },
        { _id: 'p2', user_id: 3, content: 'Second post', likes: [1], comments: [], created_at: '2024-01-01T00:01:00.000Z' },
      ];

      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockPosts),
        }),
      });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(2);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should return empty feed when no follows', async () => {
      mockAuthenticateToken.setUser({ id: 1, username: 'alice', email: 'alice@test.com', role: 'user' });

      mockFollowerModel.findAll.mockResolvedValue([]);

      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticateToken.setUser(null);

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(401);
    });

    it('should sort posts by created_at descending', async () => {
      mockAuthenticateToken.setUser({ id: 1, username: 'alice', email: 'alice@test.com', role: 'user' });

      mockFollowerModel.findAll.mockResolvedValue([{ following_id: 2 }]);

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockPostModel.find.mockReturnValue({ sort: sortMock });
      mockPostModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/posts/feed');

      expect(sortMock).toHaveBeenCalledWith({ created_at: -1 });
    });
  });
});
