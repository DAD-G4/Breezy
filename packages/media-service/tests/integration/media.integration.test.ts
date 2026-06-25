import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first — sets env vars before any imports

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import {
  connectTestDatabases,
  disconnectTestDatabases,
  clearAllTestData,
  createTestUser,
} from '@breezy/shared/src/test-utils';
import { sequelize } from '@breezy/shared/src/config/connection';
import { errorHandler } from '@breezy/shared';
import mediaRoutes from '../../src/routes/media';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/media', mediaRoutes);
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

// Create a small valid JPEG buffer for testing
function createTestImageBuffer(): Buffer {
  // Minimal valid JPEG: SOI + APP0 + DQT + SOF0 + DHT + SOS + EOI
  // This is the smallest valid JPEG file
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS' +
    'Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJ' +
    'CQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAA' +
    'AAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEG' +
    'E1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0R' +
    'FRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqK' +
    'jpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP' +
    '09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgEC' +
    'BAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLR' +
    'ChYkNOEl8RcYI4Q/SFhSRFJiX0VUkqIzLCkj/9oADAMBAAIRAxEAPwD9AooooA//2Q==',
    'base64'
  );
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

describe('Media Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'uploader@test.com',
      username: 'uploader',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'uploader@test.com',
      role: 'user',
    });
  });

  describe('POST /api/media/upload — Upload File', () => {
    it('should upload a JPEG image and return metadata', async () => {
      const imageBuffer = createTestImageBuffer();

      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', imageBuffer, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('File uploaded successfully');
      expect(res.body.data.url).toMatch(/^\/uploads\/.*\.jpg$/);
      expect(res.body.data.type).toBe('image');
      expect(res.body.data.filename).toBeDefined();
      expect(res.body.data.size).toBeGreaterThan(0);

      // Verify file was actually saved to disk
      const filePath = path.resolve(__dirname, '../../uploads', res.body.data.filename);
      expect(fs.existsSync(filePath)).toBe(true);

      // Clean up uploaded file
      fs.unlinkSync(filePath);
    });

    it('should return 400 when no file is provided', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No file provided');
    });

    it('should return 401 without auth token', async () => {
      const imageBuffer = createTestImageBuffer();

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', imageBuffer, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(401);
    });
  });
});
