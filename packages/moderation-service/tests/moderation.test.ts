import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const mockReport = {
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

const mockBan = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockUserModel = {
  findByPk: jest.fn(),
};

jest.mock('@breezy/shared', () => {
  // Set JWT_SECRET before requireActual triggers auth.ts module-scope getJwtSecret()
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    Ban: mockBan,
    UserModel: mockUserModel,
    success: jest.fn((res: any, data: any, message?: string, statusCode?: number) => {
      const code = statusCode || 200;
      const body: any = { data };
      if (message) body.message = message;
      return res.status(code).json(body);
    }),
    error: jest.fn((res: any, errorMessage: string, statusCode: number) => {
      return res.status(statusCode).json({ error: errorMessage, statusCode });
    }),
  };
});

jest.mock('@breezy/shared/src/models/mongodb/Report', () => ({
  __esModule: true,
  default: mockReport,
}));

import moderationRoutes from '../src/routes/moderation';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/moderation', moderationRoutes);
  return app;
}

function generateToken(payload: { id: number; username: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const userToken = generateToken({ id: 1, username: 'user1', email: 'user1@test.com', role: 'user' });
const modToken = generateToken({ id: 2, username: 'mod1', email: 'mod1@test.com', role: 'moderator' });
const adminToken = generateToken({ id: 3, username: 'admin1', email: 'admin1@test.com', role: 'admin' });

describe('Moderation Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/moderation/report', () => {
    it('should create a report successfully (201)', async () => {
      mockReport.create.mockResolvedValue({
        _id: 'abc123',
        reported_by: 1,
        target_type: 'post',
        target_id: 'post123',
        reason: 'Spam content',
        status: 'pending',
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'post',
          target_id: 'post123',
          reason: 'Spam content',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Report created successfully.');
      expect(mockReport.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for missing target_type', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_id: 'post123',
          reason: 'Spam content',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('target_type');
    });

    it('should return 400 for missing target_id', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'post',
          reason: 'Spam content',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('target_id');
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'post',
          target_id: 'post123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('reason');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .send({
          target_type: 'post',
          target_id: 'post123',
          reason: 'Spam',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/moderation/reports', () => {
    it('should list reports as moderator (200)', async () => {
      mockReport.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      mockReport.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reports).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });

    it('should return 200 for admin', async () => {
      mockReport.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      mockReport.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/moderation/reports/:id/resolve', () => {
    it('should resolve a report successfully (200)', async () => {
      mockReport.findByIdAndUpdate.mockResolvedValue({
        _id: 'abc123',
        status: 'resolved',
      });

      const res = await request(app)
        .put('/api/moderation/reports/abc123/resolve')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Report resolved successfully.');
    });

    it('should return 404 for non-existent report', async () => {
      mockReport.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/moderation/reports/nonexistent/resolve')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .put('/api/moderation/reports/abc123/resolve')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/moderation/ban', () => {
    it('should ban a user as admin (201)', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 5, role: 'user' });
      mockBan.create.mockResolvedValue({
        id: 1,
        user_id: 5,
        reason: 'Violating terms',
        banned_by: 3,
        expires_at: null,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: 5,
          reason: 'Violating terms',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User banned successfully.');
      expect(mockBan.create).toHaveBeenCalledTimes(1);
    });

    it('should ban a user as moderator (201)', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 5, role: 'user' });
      mockBan.create.mockResolvedValue({
        id: 2,
        user_id: 5,
        reason: 'Spamming',
        banned_by: 2,
        expires_at: null,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          user_id: 5,
          reason: 'Spamming',
        });

      expect(res.status).toBe(201);
    });

    it('should return 403 when moderator tries to ban admin', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 99, role: 'admin' });

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          user_id: 99,
          reason: 'Trying to ban admin',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });

    it('should return 403 when moderator tries to ban another moderator', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 98, role: 'moderator' });

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          user_id: 98,
          reason: 'Trying to ban moderator',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });

    it('should return 404 when target user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: 999,
          reason: 'Non-existent user',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Target user not found');
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          user_id: 5,
          reason: 'Violating terms',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });

    it('should return 400 for missing user_id', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violating terms',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('user_id');
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('reason');
    });
  });

  describe('DELETE /api/moderation/ban/:userId', () => {
    it('should unban a user as admin (200)', async () => {
      const mockBanInstance = {
        user_id: 5,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      // banChecker queries for the authenticated user (id: 3) - return null (not banned)
      // deleteBan queries for the target user (id: 5) - return the ban instance
      mockBan.findOne.mockImplementation((query) => {
        if (query?.where?.user_id === 5) {
          return Promise.resolve(mockBanInstance);
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .delete('/api/moderation/ban/5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User unbanned successfully.');
      expect(mockBanInstance.destroy).toHaveBeenCalledTimes(1);
    });

    it('should return 403 for moderator', async () => {
      // banChecker queries for mod user (id: 2) - return null (not banned)
      mockBan.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/moderation/ban/5')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });

    it('should return 403 for regular user', async () => {
      // banChecker queries for user (id: 1) - return null (not banned)
      mockBan.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/moderation/ban/5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 if no active ban found', async () => {
      // banChecker queries for admin user (id: 3) - return null (not banned)
      // deleteBan queries for user 999 - return null (no ban found)
      mockBan.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/moderation/ban/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No active ban');
    });

    it('should return 400 for invalid userId', async () => {
      // banChecker queries for admin user (id: 3) - return null (not banned)
      mockBan.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/moderation/ban/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid user ID');
    });
  });

  describe('GET /api/moderation/bans', () => {
    it('should list bans as moderator (200)', async () => {
      mockBan.findAll.mockResolvedValue([]);
      mockBan.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bans).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should list bans as admin (200)', async () => {
      mockBan.findAll.mockResolvedValue([]);
      mockBan.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 for regular user', async () => {
      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by user_id when provided', async () => {
      mockBan.findAll.mockResolvedValue([]);
      mockBan.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/moderation/bans?user_id=5')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(mockBan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 5 }),
        })
      );
    });
  });
});
