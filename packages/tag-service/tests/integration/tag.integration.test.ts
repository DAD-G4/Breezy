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
  createTestPost,
} from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import { errorHandler } from '@breezy/shared';
import tagRoutes from '../../src/routes/tags';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tags', tagRoutes);
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

describe('Tag Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'tagger@test.com',
      username: 'tagger',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'tagger@test.com',
      role: 'user',
    });
  });

  describe('GET /api/tags/search?q=tag — Search Posts by Tag', () => {
    it('should return posts matching the tag', async () => {
      // Create posts with tags
      await createTestPost(testUser.id, {
        content: 'Loving #TypeScript today',
        tags: ['typescript'],
      });
      await createTestPost(testUser.id, {
        content: 'TypeScript is great',
        tags: ['typescript'],
      });
      await createTestPost(testUser.id, {
        content: 'MongoDB post',
        tags: ['mongodb'],
      });

      const res = await request(app)
        .get('/api/tags/search?q=typescript')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('should return empty results for non-existent tag', async () => {
      await createTestPost(testUser.id, {
        content: 'A post without matching tags',
        tags: ['javascript'],
      });

      const res = await request(app)
        .get('/api/tags/search?q=nonexistent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return 400 when query parameter is missing', async () => {
      const res = await request(app)
        .get('/api/tags/search')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Search query (q) is required');
    });

    it('should return 400 when query is empty string', async () => {
      const res = await request(app)
        .get('/api/tags/search?q=')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Search query (q) is required');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/tags/search?q=typescript');

      expect(res.status).toBe(401);
    });

    it('should paginate results', async () => {
      // Create 5 posts with same tag
      for (let i = 0; i < 5; i++) {
        await createTestPost(testUser.id, {
          content: `Post ${i} about #react`,
          tags: ['react'],
        });
      }

      const res = await request(app)
        .get('/api/tags/search?q=react&page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('should match tags case-insensitively with lowercase query', async () => {
      await createTestPost(testUser.id, {
        content: 'Post with tag',
        tags: ['typescript'],
      });

      const res = await request(app)
        .get('/api/tags/search?q=TypeScript')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(1);
    });
  });
});
