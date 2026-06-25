import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectTestDatabases, disconnectTestDatabases, clearAllTestData, createTestUser } from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import ReportModel from '@breezy/shared/src/models/mongodb/Report';
import moderationRoutes from '../../src/routes/moderation';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/moderation', moderationRoutes);
  return app;
}

function generateToken(user: { id: number; username: string; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  await connectTestDatabases();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await disconnectTestDatabases();
});

beforeEach(async () => {
  await clearAllTestData();
});

describe('Moderation Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let modToken: string;
  let adminToken: string;
  let testUser: any, testMod: any, testAdmin: any;

  beforeEach(async () => {
    const userResult = await createTestUser({ email: 'user@test.com', username: 'user1', role: 'user' });
    testUser = userResult.user;
    userToken = generateToken({ id: testUser.id, username: testUser.username, email: 'user@test.com', role: 'user' });

    const modResult = await createTestUser({ email: 'mod@test.com', username: 'mod1', role: 'moderator' });
    testMod = modResult.user;
    modToken = generateToken({ id: testMod.id, username: testMod.username, email: 'mod@test.com', role: 'moderator' });

    const adminResult = await createTestUser({ email: 'admin@test.com', username: 'admin1', role: 'admin' });
    testAdmin = adminResult.user;
    adminToken = generateToken({ id: testAdmin.id, username: testAdmin.username, email: 'admin@test.com', role: 'admin' });
  });

  describe('POST /api/moderation/report', () => {
    it('should create a report and return 201', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'post',
          target_id: 'some-post-id-123',
          reason: 'Inappropriate content',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.target_type).toBe('post');
      expect(res.body.data.target_id).toBe('some-post-id-123');
      expect(res.body.data.reason).toBe('Inappropriate content');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.reported_by).toBe(testUser.id);

      // Verify in MongoDB
      const mongoReport = await ReportModel.findById(res.body.data._id);
      expect(mongoReport).not.toBeNull();
      expect(mongoReport!.target_type).toBe('post');
      expect(mongoReport!.target_id).toBe('some-post-id-123');
      expect(mongoReport!.status).toBe('pending');
    });

    it('should return 400 if target_type is missing', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ target_id: 'id-123', reason: 'Bad' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('target_type is required.');
    });

    it('should return 400 if target_id is missing', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ target_type: 'post', reason: 'Bad' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('target_id is required.');
    });

    it('should return 400 if reason is missing', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ target_type: 'post', target_id: 'id-123' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/moderation/report')
        .send({ target_type: 'post', target_id: 'id-123', reason: 'Bad' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/moderation/reports', () => {
    it('should list reports with pagination for moderator', async () => {
      // Create 3 reports
      await ReportModel.create({
        reported_by: testUser.id,
        target_type: 'post',
        target_id: 'post-1',
        reason: 'Spam',
        status: 'pending',
      });
      await ReportModel.create({
        reported_by: testUser.id,
        target_type: 'comment',
        target_id: 'comment-1',
        reason: 'Harassment',
        status: 'pending',
      });
      await ReportModel.create({
        reported_by: testUser.id,
        target_type: 'post',
        target_id: 'post-2',
        reason: 'Resolved earlier',
        status: 'resolved',
      });

      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${modToken}`)
        .query({ status: 'pending', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.reports).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('should return 403 for non-moderator users', async () => {
      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to list reports', async () => {
      const res = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('PUT /api/moderation/reports/:id/resolve', () => {
    it('should resolve a report and verify status in MongoDB', async () => {
      const report = await ReportModel.create({
        reported_by: testUser.id,
        target_type: 'post',
        target_id: 'post-to-resolve',
        reason: 'Offensive content',
        status: 'pending',
      });

      const res = await request(app)
        .put(`/api/moderation/reports/${report._id}/resolve`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');

      // Verify in MongoDB
      const updatedReport = await ReportModel.findById(report._id);
      expect(updatedReport).not.toBeNull();
      expect(updatedReport!.status).toBe('resolved');
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/moderation/reports/${fakeId}/resolve`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-moderator users', async () => {
      const report = await ReportModel.create({
        reported_by: testUser.id,
        target_type: 'post',
        target_id: 'post-123',
        reason: 'Reason',
        status: 'pending',
      });

      const res = await request(app)
        .put(`/api/moderation/reports/${report._id}/resolve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/moderation/ban', () => {
    it('should allow admin to ban a user and verify in PostgreSQL', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: testUser.id,
          reason: 'Repeated violations',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user_id).toBe(testUser.id);
      expect(res.body.data.reason).toBe('Repeated violations');
      expect(res.body.data.banned_by).toBe(testAdmin.id);

      // Verify in PostgreSQL
      const { Ban } = await import('@breezy/shared');
      const banRecord = await Ban.findOne({ where: { user_id: testUser.id } });
      expect(banRecord).not.toBeNull();
      expect(banRecord!.reason).toBe('Repeated violations');
      expect(banRecord!.banned_by).toBe(testAdmin.id);
    });

    it('should allow moderator to ban a regular user', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          user_id: testUser.id,
          reason: 'Breaking community rules',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user_id).toBe(testUser.id);
      expect(res.body.data.banned_by).toBe(testMod.id);
    });

    it('should return 403 when user without moderator role tries to ban', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          user_id: testAdmin.id,
          reason: 'Trying to ban admin',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions.');
    });

    it('should return 403 when moderator tries to ban another moderator', async () => {
      const mod2Result = await createTestUser({ email: 'mod2@test.com', username: 'mod2', role: 'moderator' });

      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          user_id: mod2Result.user.id,
          reason: 'Rival moderator',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 if user_id is missing', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'No user specified' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('user_id is required.');
    });

    it('should return 400 if reason is missing', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: testUser.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('reason is required.');
    });

    it('should return 404 for non-existent target user', async () => {
      const res = await request(app)
        .post('/api/moderation/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: 999999, reason: 'Ghost user' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/moderation/ban/:userId', () => {
    it('should unban a user and verify removal from PostgreSQL', async () => {
      // First create a ban
      const { Ban } = await import('@breezy/shared');
      await Ban.create({
        user_id: testUser.id,
        reason: 'Temporary ban',
        banned_by: testAdmin.id,
      });

      // Verify ban exists
      const beforeBan = await Ban.findOne({ where: { user_id: testUser.id } });
      expect(beforeBan).not.toBeNull();

      // Unban
      const res = await request(app)
        .delete(`/api/moderation/ban/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify removed from PostgreSQL
      const afterBan = await Ban.findOne({ where: { user_id: testUser.id } });
      expect(afterBan).toBeNull();
    });

    it('should return 404 if no active ban exists for user', async () => {
      const res = await request(app)
        .delete(`/api/moderation/ban/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .delete('/api/moderation/ban/not-a-number')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 403 for moderator trying to unban (admin only)', async () => {
      const { Ban } = await import('@breezy/shared');
      await Ban.create({
        user_id: testUser.id,
        reason: 'Temporary ban',
        banned_by: testAdmin.id,
      });

      const res = await request(app)
        .delete(`/api/moderation/ban/${testUser.id}`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/moderation/bans', () => {
    it('should list bans with pagination for admin', async () => {
      const { Ban } = await import('@breezy/shared');
      const mod2 = await createTestUser({ email: 'mod2@test.com', username: 'mod2', role: 'moderator' });

      await Ban.create({ user_id: testUser.id, reason: 'Ban 1', banned_by: testAdmin.id });
      await Ban.create({ user_id: mod2.user.id, reason: 'Ban 2', banned_by: testAdmin.id });

      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.bans).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('should filter bans by user_id', async () => {
      const { Ban } = await import('@breezy/shared');
      const mod2 = await createTestUser({ email: 'mod2@test.com', username: 'mod2', role: 'moderator' });

      await Ban.create({ user_id: testUser.id, reason: 'Ban 1', banned_by: testAdmin.id });
      await Ban.create({ user_id: mod2.user.id, reason: 'Ban 2', banned_by: testAdmin.id });

      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ user_id: testUser.id });

      expect(res.status).toBe(200);
      expect(res.body.data.bans).toHaveLength(1);
      expect(res.body.data.bans[0].user_id).toBe(testUser.id);
    });

    it('should return 403 for non-moderator users', async () => {
      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow moderator to list bans', async () => {
      const res = await request(app)
        .get('/api/moderation/bans')
        .set('Authorization', `Bearer ${modToken}`)
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
    });
  });
});
