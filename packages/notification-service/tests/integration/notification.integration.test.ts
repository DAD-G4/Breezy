import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first — sets env vars before any imports

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  connectTestDatabases,
  disconnectTestDatabases,
  clearAllTestData,
  createTestUser,
  createTestNotification,
} from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import { errorHandler } from '@breezy/shared';
import NotificationModel from '@breezy/shared/src/models/mongodb/Notification';
import notificationRoutes from '../../src/routes/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationRoutes);
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

describe('Notification Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'notifuser@test.com',
      username: 'notifuser',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'notifuser@test.com',
      role: 'user',
    });
  });

  describe('GET /api/notifications — Get Notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const { user: sender } = await createTestUser({
        email: 'sender@test.com',
        username: 'sender',
      });

      // Create notifications for testUser
      await createTestNotification(testUser.id, sender.id, { type: 'mention' });
      await createTestNotification(testUser.id, sender.id, { type: 'like' });
      await createTestNotification(testUser.id, sender.id, { type: 'follow' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(3);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('should only return notifications for the authenticated user', async () => {
      const { user: sender } = await createTestUser({
        email: 'sender@test.com',
        username: 'sender',
      });
      const { user: otherUser } = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });

      // Create notification for testUser and otherUser
      await createTestNotification(testUser.id, sender.id, { type: 'mention' });
      await createTestNotification(otherUser.id, sender.id, { type: 'mention' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].recipient_id).toBe(testUser.id);
    });

    it('should paginate notifications', async () => {
      const { user: sender } = await createTestUser({
        email: 'sender@test.com',
        username: 'sender',
      });

      // Create 5 notifications
      for (let i = 0; i < 5; i++) {
        await createTestNotification(testUser.id, sender.id, { type: 'mention' });
      }

      const res = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read — Mark as Read', () => {
    it('should mark a notification as read', async () => {
      const { user: sender } = await createTestUser({
        email: 'sender@test.com',
        username: 'sender',
      });

      const notification = await createTestNotification(testUser.id, sender.id, {
        type: 'mention',
      });

      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notification marked as read');
      expect(res.body.data.is_read).toBe(true);

      // Verify in MongoDB
      const updatedNotification = await NotificationModel.findById(notification._id);
      expect(updatedNotification).not.toBeNull();
      expect(updatedNotification!.is_read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    it('should return 403 when trying to mark another user\'s notification', async () => {
      const { user: sender } = await createTestUser({
        email: 'sender@test.com',
        username: 'sender',
      });
      const { user: otherUser } = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });

      // Create notification for otherUser
      const notification = await createTestNotification(otherUser.id, sender.id, {
        type: 'mention',
      });

      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should return 401 without auth token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`);

      expect(res.status).toBe(401);
    });
  });
});
