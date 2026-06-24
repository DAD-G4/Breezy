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
} from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import { Follower, BlockedUser } from '@breezy/shared/src/models/postgres';
import { errorHandler } from '@breezy/shared';
import usersRoutes from '../../src/routes/users';
import followsRoutes from '../../src/routes/follows';
import blocksRoutes from '../../src/routes/blocks';
import publicUsersRoutes from '../../src/routes/publicUsers';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRoutes);
  app.use('/api/users', followsRoutes);
  app.use('/api/users', blocksRoutes);
  app.use('/api/users', publicUsersRoutes);
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

describe('Block Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;
  let targetUser: any;
  let targetToken: string;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'blocker@test.com',
      username: 'blocker',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'blocker@test.com',
      role: 'user',
    });

    const targetResult = await createTestUser({
      email: 'blocked@test.com',
      username: 'blocked',
    });
    targetUser = targetResult.user;
    targetToken = generateToken({
      id: targetUser.id,
      username: targetUser.username,
      email: 'blocked@test.com',
      role: 'user',
    });
  });

  describe('POST /api/users/block/:id — Block User', () => {
    it('should create a BlockedUser row', async () => {
      const res = await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully blocked user');

      // Verify block exists in PostgreSQL
      const blockRecord = await BlockedUser.findOne({
        where: { blocker_id: testUser.id, blocked_id: targetUser.id },
      });
      expect(blockRecord).not.toBeNull();
    });

    it('should remove both follow directions (mutual unfollow)', async () => {
      // Establish a mutual follow relationship first.
      await request(app)
        .post(`/api/users/follow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app)
        .post(`/api/users/follow/${testUser.id}`)
        .set('Authorization', `Bearer ${targetToken}`)
        .expect(200);

      // Sanity check: both follow rows exist before the block.
      expect(
        await Follower.findOne({
          where: { follower_id: testUser.id, following_id: targetUser.id },
        })
      ).not.toBeNull();
      expect(
        await Follower.findOne({
          where: { follower_id: targetUser.id, following_id: testUser.id },
        })
      ).not.toBeNull();

      const res = await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      // Both follow directions must be gone after the block.
      const blockerFollowsTarget = await Follower.findOne({
        where: { follower_id: testUser.id, following_id: targetUser.id },
      });
      const targetFollowsBlocker = await Follower.findOne({
        where: { follower_id: targetUser.id, following_id: testUser.id },
      });
      expect(blockerFollowsTarget).toBeNull();
      expect(targetFollowsBlocker).toBeNull();
    });

    it('should return 400 when trying to block yourself', async () => {
      const res = await request(app)
        .post(`/api/users/block/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot block yourself');
    });

    it('should return 409 when already blocked', async () => {
      await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const res = await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Already blocked');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post(`/api/users/block/${targetUser.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('is_blocked flag on profile lookups', () => {
    it('GET /api/users/profile/:id returns is_blocked: true when viewer blocked the target', async () => {
      await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/users/profile/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_blocked).toBe(true);
    });

    it('GET /api/users/profile/:id returns is_blocked: true when the target blocked the viewer', async () => {
      // targetUser blocks testUser; testUser (viewer) looks up targetUser.
      await request(app)
        .post(`/api/users/block/${testUser.id}`)
        .set('Authorization', `Bearer ${targetToken}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/users/profile/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_blocked).toBe(true);
    });

    it('GET /api/users/profile/:id returns is_blocked: false when no block exists', async () => {
      const res = await request(app)
        .get(`/api/users/profile/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_blocked).toBe(false);
    });

    it('GET /api/users/username/:username returns is_blocked: true between two users where one blocked the other', async () => {
      await request(app)
        .post(`/api/users/block/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/users/username/${targetUser.username}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(targetUser.username);
      expect(res.body.data.is_blocked).toBe(true);
    });

    it('GET /api/users/username/:username returns is_blocked: false when no block exists', async () => {
      const res = await request(app)
        .get(`/api/users/username/${targetUser.username}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_blocked).toBe(false);
    });
  });
});
