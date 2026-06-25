import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first — sets env vars before any imports

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  connectTestDatabases,
  disconnectTestDatabases,
  clearAllTestData,
  createTestUser,
  createTestDM,
} from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import DirectMessageModel from '@breezy/shared/src/models/mongodb/DirectMessage';
import { errorHandler } from '@breezy/shared';
import dmRoutes from '../../src/routes/dms';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dms', dmRoutes);
  app.use(errorHandler);
  return app;
}

function generateToken(user: {
  id: number;
  username: string;
  email: string;
  role: string;
}) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  await connectTestDatabases();
  await sequelize.sync({ force: true }); // Create tables
});

afterAll(async () => {
  await disconnectTestDatabases();
});

beforeEach(async () => {
  await clearAllTestData(); // Clean between tests
});

describe('DM Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;
  let otherUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'sender@test.com',
      username: 'sender',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'sender@test.com',
      role: 'user',
    });

    const otherResult = await createTestUser({
      email: 'receiver@test.com',
      username: 'receiver',
    });
    otherUser = otherResult.user;
  });

  describe('POST /api/dms/send — Send Message', () => {
    it('should send a DM and persist in MongoDB', async () => {
      const res = await request(app)
        .post('/api/dms/send')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient_id: otherUser.id,
          message_text: 'Hello from integration test',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Message sent successfully');
      expect(res.body.data.sender_id).toBe(testUser.id);
      expect(res.body.data.recipient_id).toBe(otherUser.id);
      expect(res.body.data.message_text).toBe('Hello from integration test');
      expect(res.body.data.is_read).toBe(false);
      expect(res.body.data.conversation_id).toBeDefined();

      // Verify persisted in real MongoDB
      const mongoDm = await DirectMessageModel.findById(res.body.data._id);
      expect(mongoDm).not.toBeNull();
      expect(mongoDm!.sender_id).toBe(testUser.id);
      expect(mongoDm!.recipient_id).toBe(otherUser.id);
      expect(mongoDm!.message_text).toBe('Hello from integration test');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/dms/send')
        .send({
          recipient_id: otherUser.id,
          message_text: 'Hello',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dms/conversation/:userId — Get Conversation', () => {
    it('should return messages between two users', async () => {
      const conversationId = [testUser.id, otherUser.id].sort().join('-');

      // Create messages
      await createTestDM(testUser.id, otherUser.id, {
        text: 'Hello from sender',
        conversationId,
      });
      await createTestDM(otherUser.id, testUser.id, {
        text: 'Reply from receiver',
        conversationId,
      });

      const res = await request(app)
        .get(`/api/dms/conversation/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.messages[0].message_text).toBe('Hello from sender');
      expect(res.body.data.messages[1].message_text).toBe('Reply from receiver');
    });

    it('should return empty conversation for users with no messages', async () => {
      const res = await request(app)
        .get(`/api/dms/conversation/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/api/dms/conversation/not-a-number')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('GET /api/dms/conversations — Get Conversation List', () => {
    it('should return list of conversations with last message', async () => {
      const conversationId = [testUser.id, otherUser.id].sort().join('-');

      await createTestDM(testUser.id, otherUser.id, {
        text: 'Latest message',
        conversationId,
      });

      const res = await request(app)
        .get('/api/dms/conversations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(1);
      expect(res.body.data.conversations[0].conversation_id).toBe(conversationId);
      expect(res.body.data.conversations[0].last_message.message_text).toBe('Latest message');
      expect(res.body.data.conversations[0].other_user_id).toBe(otherUser.id);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should return empty list when no conversations exist', async () => {
      const res = await request(app)
        .get('/api/dms/conversations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  describe('PUT /api/dms/conversation/:userId/read — Mark Conversation as Read', () => {
    it('should mark all unread messages as read', async () => {
      const conversationId = [testUser.id, otherUser.id].sort().join('-');

      // Create unread messages from otherUser to testUser
      await createTestDM(otherUser.id, testUser.id, {
        text: 'Unread message 1',
        conversationId,
      });
      await createTestDM(otherUser.id, testUser.id, {
        text: 'Unread message 2',
        conversationId,
      });

      const res = await request(app)
        .put(`/api/dms/conversation/${otherUser.id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(2);

      // Verify messages are read in MongoDB
      const messages = await DirectMessageModel.find({ conversation_id: conversationId });
      expect(messages.every((m) => m.is_read === true)).toBe(true);
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .put('/api/dms/conversation/not-a-number/read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });
});
