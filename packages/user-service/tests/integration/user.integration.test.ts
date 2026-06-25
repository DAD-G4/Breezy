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
import { Follower } from '@breezy/shared/src/models/postgres';
import { errorHandler } from '@breezy/shared';
import usersRoutes from '../../src/routes/users';
import followsRoutes from '../../src/routes/follows';
import publicUsersRoutes from '../../src/routes/publicUsers';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRoutes);
  app.use('/api/users', followsRoutes);
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

describe('User Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'user@test.com',
      username: 'testuser',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'user@test.com',
      role: 'user',
    });
  });

  describe('GET /api/users/profile/:id — Get User Profile', () => {
    it('should return user profile with counts', async () => {
      const res = await request(app)
        .get(`/api/users/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(testUser.id);
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('user@test.com');
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.followers_count).toBe(0);
      expect(res.body.data.following_count).toBe(0);
      expect(res.body.data.post_count).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/profile/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get(`/api/users/profile/${testUser.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile/:id — Update Profile', () => {
    it('should update own profile and persist changes', async () => {
      const res = await request(app)
        .put(`/api/users/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          display_name: 'Updated Name',
          bio: 'This is my new bio',
          avatar_url: 'https://example.com/avatar.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.data.display_name).toBe('Updated Name');
      expect(res.body.data.bio).toBe('This is my new bio');
      expect(res.body.data.avatar_url).toBe('https://example.com/avatar.jpg');

      // Verify persisted in PostgreSQL
      const verifyRes = await request(app)
        .get(`/api/users/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(verifyRes.body.data.profile.display_name).toBe('Updated Name');
      expect(verifyRes.body.data.profile.bio).toBe('This is my new bio');
    });

    it('should return 403 when updating another user\'s profile', async () => {
      const { user: otherUser } = await createTestUser({
        email: 'other@test.com',
        username: 'otheruser',
      });

      const res = await request(app)
        .put(`/api/users/profile/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ display_name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('POST /api/users/follow/:id — Follow User', () => {
    it('should follow a user and create notification', async () => {
      const { user: targetUser } = await createTestUser({
        email: 'target@test.com',
        username: 'targetuser',
      });

      const res = await request(app)
        .post(`/api/users/follow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully followed user');
      expect(res.body.data.follower_id).toBe(testUser.id);
      expect(res.body.data.following_id).toBe(targetUser.id);

      // Verify follow exists in PostgreSQL
      const followRecord = await Follower.findOne({
        where: { follower_id: testUser.id, following_id: targetUser.id },
      });
      expect(followRecord).not.toBeNull();
    });

    it('should return 400 when trying to follow yourself', async () => {
      const res = await request(app)
        .post(`/api/users/follow/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot follow yourself');
    });

    it('should return 409 when already following', async () => {
      const { user: targetUser } = await createTestUser({
        email: 'target@test.com',
        username: 'targetuser',
      });

      // Follow first time
      await request(app)
        .post(`/api/users/follow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Try following again
      const res = await request(app)
        .post(`/api/users/follow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Already following');
    });
  });

  describe('DELETE /api/users/unfollow/:id — Unfollow User', () => {
    it('should unfollow a user', async () => {
      const { user: targetUser } = await createTestUser({
        email: 'target@test.com',
        username: 'targetuser',
      });

      // Follow first
      await request(app)
        .post(`/api/users/follow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Unfollow
      const res = await request(app)
        .delete(`/api/users/unfollow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully unfollowed user');

      // Verify removed from PostgreSQL
      const followRecord = await Follower.findOne({
        where: { follower_id: testUser.id, following_id: targetUser.id },
      });
      expect(followRecord).toBeNull();
    });

    it('should return 404 when not following', async () => {
      const { user: targetUser } = await createTestUser({
        email: 'target@test.com',
        username: 'targetuser',
      });

      const res = await request(app)
        .delete(`/api/users/unfollow/${targetUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not following this user');
    });
  });

  describe('POST /api/users/batch — Batch Profiles', () => {
    it('should return batch profiles for given IDs', async () => {
      const { user: user2 } = await createTestUser({
        email: 'user2@test.com',
        username: 'user2',
      });

      const res = await request(app)
        .post('/api/users/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ids: [testUser.id, user2.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(2);
      expect(res.body.data.users[0].username).toBeDefined();
      expect(res.body.data.users[1].username).toBeDefined();
    });

    it('should return 400 when ids is missing', async () => {
      const res = await request(app)
        .post('/api/users/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ids array is required');
    });

    it('should return 400 when ids is empty', async () => {
      const res = await request(app)
        .post('/api/users/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ids: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ids array is required');
    });

    it('should return 400 when too many IDs', async () => {
      const ids = Array.from({ length: 101 }, (_, i) => i + 1);
      const res = await request(app)
        .post('/api/users/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ids });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Too many IDs (max 100)');
    });
  });
});
