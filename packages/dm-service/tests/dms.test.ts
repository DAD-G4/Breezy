import express from 'express';
import request from 'supertest';

const mockDirectMessageModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn(),
  updateMany: jest.fn(),
};

let mockAuthenticatedUser: { id: number; username: string; email: string; role: string } | null = null;

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    DirectMessageModel: mockDirectMessageModel,
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

// Mock the DirectMessage model import used by the controller
jest.mock('@breezy/shared/src/models/mongodb/DirectMessage', () => ({
  __esModule: true,
  default: mockDirectMessageModel,
}));

import dmRoutes from '../src/routes/dms';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dms', dmRoutes);
  return app;
}

describe('DM Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser = null;
  });

  describe('POST /api/dms/send', () => {
    it('should send a message successfully and return 201', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockDm = {
        _id: 'dm1',
        conversation_id: '1-2',
        sender_id: 1,
        recipient_id: 2,
        message_text: 'Hello there!',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockDirectMessageModel.create.mockResolvedValue(mockDm);

      const res = await request(app)
        .post('/api/dms/send')
        .send({ recipient_id: 2, message_text: 'Hello there!' });

      expect(res.status).toBe(201);
      expect(res.body.data.conversation_id).toBe('1-2');
      expect(res.body.data.sender_id).toBe(1);
      expect(res.body.data.recipient_id).toBe(2);
      expect(res.body.data.message_text).toBe('Hello there!');
      expect(res.body.message).toBe('Message sent successfully');
    });

    it('should return 400 if message_text is empty', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app)
        .post('/api/dms/send')
        .send({ recipient_id: 2, message_text: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if message_text exceeds 1000 characters', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const longMessage = 'a'.repeat(1001);

      const res = await request(app)
        .post('/api/dms/send')
        .send({ recipient_id: 2, message_text: longMessage });

      expect(res.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app)
        .post('/api/dms/send')
        .send({ recipient_id: 2, message_text: 'Hello!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dms/conversation/:userId', () => {
    it('should return conversation messages with default pagination', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const mockMessages = [
        { _id: 'dm1', conversation_id: '1-2', sender_id: 2, recipient_id: 1, message_text: 'Hi!', created_at: '2024-01-01T00:00:00.000Z' },
        { _id: 'dm2', conversation_id: '1-2', sender_id: 1, recipient_id: 2, message_text: 'Hello!', created_at: '2024-01-01T00:01:00.000Z' },
      ];

      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockMessages),
        }),
      });

      mockDirectMessageModel.find.mockReturnValue({ sort: sortMock });
      mockDirectMessageModel.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/dms/conversation/2');

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toEqual(mockMessages);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      });
    });

    it('should sort messages chronologically (ascending)', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockDirectMessageModel.find.mockReturnValue({ sort: sortMock });
      mockDirectMessageModel.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/dms/conversation/2');

      expect(sortMock).toHaveBeenCalledWith({ created_at: 1 });
    });

    it('should return empty conversation', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      mockDirectMessageModel.find.mockReturnValue({ sort: sortMock });
      mockDirectMessageModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/dms/conversation/2');

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/dms/conversation/2');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dms/conversations', () => {
    it('should return conversations with last message and unread count', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.distinct.mockResolvedValue(['1-2', '1-3']);

      const lastMessage2 = {
        _id: 'dm1',
        conversation_id: '1-2',
        sender_id: 2,
        recipient_id: 1,
        message_text: 'Hey!',
        is_read: false,
        created_at: new Date('2024-01-02T00:00:00.000Z'),
      };
      const lastMessage3 = {
        _id: 'dm3',
        conversation_id: '1-3',
        sender_id: 1,
        recipient_id: 3,
        message_text: 'Hi there!',
        is_read: false,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockDirectMessageModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValueOnce(lastMessage2),
        }),
      });
      mockDirectMessageModel.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValueOnce(lastMessage2),
        }),
      });
      mockDirectMessageModel.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValueOnce(lastMessage3),
        }),
      });

      mockDirectMessageModel.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      const res = await request(app).get('/api/dms/conversations');

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(2);
      expect(res.body.data.conversations[0].conversation_id).toBe('1-2');
      expect(res.body.data.conversations[0].other_user_id).toBe(2);
      expect(res.body.data.conversations[0].unread_count).toBe(2);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should return empty list when no conversations', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.distinct.mockResolvedValue([]);

      const res = await request(app).get('/api/dms/conversations');

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/dms/conversations');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dms/unread-count', () => {
    it('should return total unread count', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.countDocuments.mockReset();
      mockDirectMessageModel.countDocuments.mockResolvedValue(5);

      const res = await request(app).get('/api/dms/unread-count');

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(5);
    });

    it('should return 0 when no unread messages', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/dms/unread-count');

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).get('/api/dms/unread-count');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/dms/conversation/:userId/read', () => {
    it('should mark conversation messages as read', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await request(app).put('/api/dms/conversation/2/read');

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(3);
      expect(mockDirectMessageModel.updateMany).toHaveBeenCalledWith(
        {
          conversation_id: '1-2',
          recipient_id: 1,
          is_read: false,
        },
        { $set: { is_read: true } },
      );
    });

    it('should return 0 updated when no unread messages', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      mockDirectMessageModel.updateMany.mockResolvedValue({ modifiedCount: 0 });

      const res = await request(app).put('/api/dms/conversation/2/read');

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(0);
    });

    it('should return 400 for invalid user ID', async () => {
      mockAuthenticatedUser = { id: 1, username: 'alice', email: 'alice@test.com', role: 'user' };

      const res = await request(app).put('/api/dms/conversation/abc/read');

      expect(res.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      mockAuthenticatedUser = null;

      const res = await request(app).put('/api/dms/conversation/2/read');

      expect(res.status).toBe(401);
    });
  });
});
