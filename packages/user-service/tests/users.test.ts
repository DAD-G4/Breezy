import express from 'express';
import request from 'supertest';

const mockUserModel = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
};

const mockProfileModel = {
  findOne: jest.fn(),
};

const mockFollowerModel = {
  count: jest.fn(),
};

const mockPostModel = {
  countDocuments: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    UserModel: mockUserModel,
    ProfileModel: mockProfileModel,
    Follower: mockFollowerModel,
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

import userRoutes from '../src/routes/users';
import publicUsers from '../src/routes/publicUsers';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', publicUsers);
  app.use('/api/users', userRoutes);
  return app;
}

describe('User Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('GET /api/users/profile/:id', () => {
    it('should return user profile successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockUserData = {
        id: 1,
        username: 'alice',
        email: 'alice@test.com',
        role: 'user',
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'Alice',
          bio: 'Hello world',
          avatar_url: 'https://example.com/avatar.jpg',
          language_preference: 'en',
          theme_preference: 'light',
        },
        toJSON() {
          return { ...this };
        },
      };

      mockUserModel.findByPk.mockResolvedValue(mockUserData);
      mockFollowerModel.count.mockResolvedValueOnce(10);
      mockFollowerModel.count.mockResolvedValueOnce(5);
      mockPostModel.countDocuments.mockResolvedValue(3);

      const res = await request(app).get('/api/users/profile/1');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.username).toBe('alice');
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.followers_count).toBe(10);
      expect(res.body.data.following_count).toBe(5);
      expect(res.body.data.post_count).toBe(3);
      expect(mockUserModel.findByPk).toHaveBeenCalledWith('1', {
        include: [{ model: expect.anything(), as: 'profile' }],
        attributes: { exclude: ['password_hash'] },
      });
    });

    it('should return 404 if user not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockUserModel.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/users/profile/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 if no token provided', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/users/profile/1');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile/:id', () => {
    it('should update profile successfully when owner', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockProfile = {
        id: 1,
        user_id: 1,
        display_name: 'Alice',
        bio: 'Old bio',
        avatar_url: null,
        language_preference: 'en',
        theme_preference: 'light',
        update: jest.fn(),
      };

      mockProfileModel.findOne.mockResolvedValue(mockProfile);

      const res = await request(app)
        .put('/api/users/profile/1')
        .send({ display_name: 'New Name', bio: 'New bio' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(mockProfile.update).toHaveBeenCalledWith({
        display_name: 'New Name',
        bio: 'New bio',
      });
    });

    it('should return 403 if not owner', async () => {
      mockAuthenticatedUser = { id: 2, username: 'bob', email: 'bob@test.com', role: 'user' };

      const res = await request(app)
        .put('/api/users/profile/1')
        .send({ display_name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should return 404 if profile not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockProfileModel.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/profile/1')
        .send({ display_name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Profile not found');
    });
  });

  describe('PUT /api/users/settings/:id', () => {
    it('should update settings successfully when owner', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockProfile = {
        id: 1,
        user_id: 1,
        display_name: 'Alice',
        bio: 'Hello',
        avatar_url: null,
        language_preference: 'en',
        theme_preference: 'light',
        update: jest.fn(),
      };

      mockProfileModel.findOne.mockResolvedValue(mockProfile);

      const res = await request(app)
        .put('/api/users/settings/1')
        .send({ language_preference: 'fr', theme_preference: 'dark' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Settings updated successfully');
      expect(mockProfile.update).toHaveBeenCalledWith({
        language_preference: 'fr',
        theme_preference: 'dark',
      });
    });

    it('should return 403 if not owner', async () => {
      mockAuthenticatedUser = { id: 2, username: 'bob', email: 'bob@test.com', role: 'user' };

      const res = await request(app)
        .put('/api/users/settings/1')
        .send({ language_preference: 'fr' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should return 404 if profile not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockProfileModel.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/settings/1')
        .send({ theme_preference: 'dark' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Profile not found');
    });
  });

  describe('GET /api/users/username/:username (public, no auth)', () => {
    it('should return 200 with full profile when username exists', async () => {
      const mockUserData = {
        id: 1,
        username: 'alice',
        email: 'alice@test.com',
        role: 'user',
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'Alice',
          bio: 'Hello world',
          avatar_url: 'https://example.com/avatar.jpg',
          language_preference: 'en',
          theme_preference: 'light',
        },
        toJSON() {
          return { ...this };
        },
        get(field: string) {
          if (field === 'id') return this.id;
          return undefined;
        },
      };

      mockUserModel.findOne.mockResolvedValue(mockUserData);
      mockFollowerModel.count.mockResolvedValueOnce(10);
      mockFollowerModel.count.mockResolvedValueOnce(5);
      mockPostModel.countDocuments.mockResolvedValue(3);

      // No auth header — public route
      const res = await request(app).get('/api/users/username/alice');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.username).toBe('alice');
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.followers_count).toBe(10);
      expect(res.body.data.following_count).toBe(5);
      expect(res.body.data.post_count).toBe(3);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { username: 'alice' },
        include: [{ model: expect.anything(), as: 'profile' }],
        attributes: { exclude: ['password_hash'] },
      });
    });

    it('should return 404 when username does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/users/username/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should work WITHOUT Authorization header (public)', async () => {
      mockAuthenticatedUser = null;

      const mockUserData = {
        id: 2,
        username: 'bob',
        email: 'bob@test.com',
        role: 'user',
        profile: null,
        toJSON() {
          return { ...this };
        },
        get(field: string) {
          if (field === 'id') return this.id;
          return undefined;
        },
      };

      mockUserModel.findOne.mockResolvedValue(mockUserData);
      mockFollowerModel.count.mockResolvedValueOnce(0);
      mockFollowerModel.count.mockResolvedValueOnce(0);
      mockPostModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/users/username/bob');

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('bob');
      expect(res.body.data.followers_count).toBe(0);
      expect(res.body.data.following_count).toBe(0);
      expect(res.body.data.post_count).toBe(0);
    });

    it('should include followers_count, following_count, post_count in response', async () => {
      const mockUserData = {
        id: 3,
        username: 'carol',
        email: 'carol@test.com',
        role: 'user',
        profile: {
          id: 3,
          user_id: 3,
          display_name: 'Carol',
          bio: null,
          avatar_url: null,
          language_preference: 'en',
          theme_preference: 'light',
        },
        toJSON() {
          return { ...this };
        },
        get(field: string) {
          if (field === 'id') return this.id;
          return undefined;
        },
      };

      mockUserModel.findOne.mockResolvedValue(mockUserData);
      mockFollowerModel.count.mockResolvedValueOnce(42);
      mockFollowerModel.count.mockResolvedValueOnce(17);
      mockPostModel.countDocuments.mockResolvedValue(88);

      const res = await request(app).get('/api/users/username/carol');

      expect(res.status).toBe(200);
      expect(res.body.data.followers_count).toBe(42);
      expect(res.body.data.following_count).toBe(17);
      expect(res.body.data.post_count).toBe(88);
    });
  });
});
