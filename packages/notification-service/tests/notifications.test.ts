import express from 'express';
import request from 'supertest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNotifications: any[] = [];
const mockNotificationDoc = {
  save: jest.fn(),
};

const mockNotificationModel = {
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => ({
  Notification: mockNotificationModel,
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

// Mock the Notification model import used by the controller
jest.mock('@breezy/shared/src/models/mongodb/Notification', () => ({
  __esModule: true,
  default: mockNotificationModel,
}));

import notificationRoutes from '../src/routes/notifications';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationRoutes);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Notification Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications with default pagination', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockNotificationsList = [
        { _id: 'n1', recipient_id: 1, sender_id: 2, type: 'like', is_read: false, created_at: '2024-01-02T00:00:00.000Z' },
        { _id: 'n2', recipient_id: 1, sender_id: 3, type: 'follow', is_read: true, created_at: '2024-01-01T00:00:00.000Z' },
      ];

      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNotificationsList),
        }),
      });

      mockNotificationModel.find.mockReturnValue({ sort: sortMock });
      mockNotificationModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toEqual(mockNotificationsList);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should support custom pagination params', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockNotificationsList = [
        { _id: 'n3', recipient_id: 1, sender_id: 4, type: 'mention', is_read: false, created_at: new Date('2024-01-03') },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockNotificationsList);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockNotificationModel.find.mockReturnValue({ sort: sortMock });
      mockNotificationModel.countDocuments.mockResolvedValue(25);

      const res = await request(app).get('/api/notifications?page=2&limit=10');

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

    it('should sort notifications by created_at descending', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockNotificationModel.find.mockReturnValue({ sort: sortMock });
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/notifications');

      expect(sortMock).toHaveBeenCalledWith({ created_at: -1 });
    });

    it('should query by recipient_id matching user id', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockNotificationModel.find.mockReturnValue({ sort: sortMock });
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/notifications');

      expect(mockNotificationModel.find).toHaveBeenCalledWith({ recipient_id: 1 });
      expect(mockNotificationModel.countDocuments).toHaveBeenCalledWith({ recipient_id: 1 });
    });

    it('should return empty notifications list', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockNotificationModel.find.mockReturnValue({ sort: sortMock });
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read successfully', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockNotification = {
        _id: 'n1',
        recipient_id: 1,
        sender_id: 2,
        type: 'like',
        is_read: false,
        created_at: new Date('2024-01-01'),
        save: jest.fn().mockResolvedValue(true),
      };

      mockNotificationModel.findById.mockResolvedValue(mockNotification);

      const res = await request(app).put('/api/notifications/n1/read');

      expect(res.status).toBe(200);
      expect(mockNotification.is_read).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(res.body.message).toBe('Notification marked as read');
    });

    it('should return 403 if notification belongs to another user', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockNotification = {
        _id: 'n1',
        recipient_id: 2,
        sender_id: 3,
        type: 'like',
        is_read: false,
        save: jest.fn(),
      };

      mockNotificationModel.findById.mockResolvedValue(mockNotification);

      const res = await request(app).put('/api/notifications/n1/read');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
      expect(mockNotification.save).not.toHaveBeenCalled();
    });

    it('should return 404 if notification not found', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockNotificationModel.findById.mockResolvedValue(null);

      const res = await request(app).put('/api/notifications/nonexistent/read');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).put('/api/notifications/n1/read');

      expect(res.status).toBe(401);
    });
  });
});
