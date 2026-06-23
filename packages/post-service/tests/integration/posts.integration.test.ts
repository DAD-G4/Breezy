import { loadTestEnv } from '@breezy/shared/src/test-utils/setup';
loadTestEnv(); // Must be first

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
import PostModel from '@breezy/shared/src/models/mongodb/Post';
import NotificationModel from '@breezy/shared/src/models/mongodb/Notification';
import { Follower } from '@breezy/shared/src/models/postgres';
import postRoutes from '../../src/routes/posts';
import feedRoutes from '../../src/routes/feed';
import likeRoutes from '../../src/routes/likes';
import commentRoutes from '../../src/routes/comments';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/posts', postRoutes);
  app.use('/api/posts', feedRoutes);
  app.use('/api/posts', likeRoutes);
  app.use('/api/posts', commentRoutes);
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
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await disconnectTestDatabases();
});

beforeEach(async () => {
  await clearAllTestData();
});

describe('Post Integration Tests', () => {
  const app = buildApp();
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    const result = await createTestUser({
      email: 'poster@test.com',
      username: 'poster',
    });
    testUser = result.user;
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      email: 'poster@test.com',
      role: 'user',
    });
  });

  describe('POST /api/posts — Create Post', () => {
    it('should create a post and persist it in real MongoDB', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Hello world' });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe('Hello world');
      expect(res.body.data.user_id).toBe(testUser.id);
      expect(res.body.message).toBe('Post created successfully');

      // Verify persisted in real MongoDB
      const mongoPost = await PostModel.findById(res.body.data._id);
      expect(mongoPost).not.toBeNull();
      expect(mongoPost!.content).toBe('Hello world');
      expect(mongoPost!.user_id).toBe(testUser.id);
      expect(mongoPost!.likes).toEqual([]);
      expect(mongoPost!.comments).toEqual([]);
    });

    it('should extract hashtags and store them on the post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Loving #TypeScript and #MongoDB today' });

      expect(res.status).toBe(201);
      expect(res.body.data.tags).toEqual(['typescript', 'mongodb']);

      // Verify tags persisted in real MongoDB
      const mongoPost = await PostModel.findById(res.body.data._id);
      expect(mongoPost!.tags).toEqual(['typescript', 'mongodb']);
    });

    it('should create a mention notification in MongoDB when mentioning another user', async () => {
      // Create a user to mention
      const { user: mentionTarget } = await createTestUser({
        email: 'bob@test.com',
        username: 'bob',
      });

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Hey @bob, check this out!' });

      expect(res.status).toBe(201);

      // Verify mention notification persisted in real MongoDB
      const notification = await NotificationModel.findOne({
        recipient_id: mentionTarget.id,
        sender_id: testUser.id,
        type: 'mention',
      });
      expect(notification).not.toBeNull();
      expect(notification!.is_read).toBe(false);
      expect(notification!.post_id).toBeDefined();

      // Verify the notification references the created post
      const mongoPost = await PostModel.findById(res.body.data._id);
      expect(mongoPost).not.toBeNull();
      expect(notification!.post_id!.toString()).toBe(mongoPost!._id.toString());
    });
  });

  describe('GET /api/posts/user/:id — User Posts', () => {
    it('should return user posts with pagination metadata', async () => {
      // Create 3 posts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: `Post number ${i}` });
      }

      const res = await request(app)
        .get(`/api/posts/user/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(3);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('should paginate with custom page and limit', async () => {
      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: `Post ${i}` });
      }

      const res = await request(app)
        .get(`/api/posts/user/${testUser.id}?page=2&limit=2`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(2);
      expect(res.body.data.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });
  });

  describe('PUT /api/posts/:id — Update Post', () => {
    it('should update own post content and re-extract tags', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Original content' });

      const postId = createRes.body.data._id;

      const updateRes = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Updated content #newtag' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.content).toBe('Updated content #newtag');
      expect(updateRes.body.data.tags).toEqual(['newtag']);
      expect(updateRes.body.message).toBe('Post updated successfully');

      // Verify updated in real MongoDB
      const mongoPost = await PostModel.findById(postId);
      expect(mongoPost!.content).toBe('Updated content #newtag');
      expect(mongoPost!.tags).toEqual(['newtag']);
    });
  });

  describe('DELETE /api/posts/:id — Delete Post', () => {
    it('should delete own post and remove it from MongoDB', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Post to delete' });

      const postId = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deleted).toBe(true);
      expect(deleteRes.body.message).toBe('Post deleted successfully');

      // Verify deleted from real MongoDB
      const mongoPost = await PostModel.findById(postId);
      expect(mongoPost).toBeNull();
    });

    it('should return 403 when deleting another user\'s post', async () => {
      // Create a post as testUser
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Not my post' });

      const postId = createRes.body.data._id;

      // Create another user and try to delete
      const { user: otherUser } = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });
      const otherToken = generateToken({
        id: otherUser.id,
        username: otherUser.username,
        email: 'other@test.com',
        role: 'user',
      });

      const deleteRes = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toContain('Forbidden');

      // Verify post still exists in MongoDB
      const mongoPost = await PostModel.findById(postId);
      expect(mongoPost).not.toBeNull();
      expect(mongoPost!.content).toBe('Not my post');
    });
  });

  describe('POST /api/posts/:id/like — Like / Unlike', () => {
    it('should like a post and persist the like in MongoDB', async () => {
      // Create a post as testUser
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Likeable post' });

      const postId = createRes.body.data._id;

      // Create another user to like the post
      const { user: liker } = await createTestUser({
        email: 'liker@test.com',
        username: 'liker',
      });
      const likerToken = generateToken({
        id: liker.id,
        username: liker.username,
        email: 'liker@test.com',
        role: 'user',
      });

      const likeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${likerToken}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.data.liked).toBe(true);
      expect(likeRes.body.data.likesCount).toBe(1);

      // Verify like persisted in real MongoDB
      const mongoPost = await PostModel.findById(postId);
      expect(mongoPost!.likes).toContain(liker.id);
    });

    it('should unlike a previously liked post', async () => {
      // Create a post as testUser
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Likeable post' });

      const postId = createRes.body.data._id;

      // Create another user
      const { user: liker } = await createTestUser({
        email: 'liker@test.com',
        username: 'liker',
      });
      const likerToken = generateToken({
        id: liker.id,
        username: liker.username,
        email: 'liker@test.com',
        role: 'user',
      });

      // Like first
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${likerToken}`);

      // Unlike
      const unlikeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${likerToken}`);

      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.data.liked).toBe(false);
      expect(unlikeRes.body.data.likesCount).toBe(0);

      // Verify like removed in real MongoDB
      const mongoPost = await PostModel.findById(postId);
      expect(mongoPost!.likes).not.toContain(liker.id);
    });
  });

  describe('GET /api/posts — Feed', () => {
    it('should return posts from followed users', async () => {
      // Create another user to follow
      const { user: followedUser } = await createTestUser({
        email: 'followed@test.com',
        username: 'followed',
      });

      // testUser follows followedUser
      await Follower.create({
        follower_id: testUser.id,
        following_id: followedUser.id,
      });

      // Create a post as followedUser
      const followedToken = generateToken({
        id: followedUser.id,
        username: followedUser.username,
        email: 'followed@test.com',
        role: 'user',
      });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${followedToken}`)
        .send({ content: 'Post from followed user' });

      // Get feed as testUser
      const feedRes = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(feedRes.status).toBe(200);
      expect(feedRes.body.data.posts).toHaveLength(1);
      expect(feedRes.body.data.posts[0].content).toBe(
        'Post from followed user',
      );
      expect(feedRes.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should not return posts from users you do not follow', async () => {
      // Create another user that testUser does NOT follow
      const { user: unfollowedUser } = await createTestUser({
        email: 'unfollowed@test.com',
        username: 'unfollowed',
      });

      // Create a post as unfollowedUser
      const unfollowedToken = generateToken({
        id: unfollowedUser.id,
        username: unfollowedUser.username,
        email: 'unfollowed@test.com',
        role: 'user',
      });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${unfollowedToken}`)
        .send({ content: 'Post from unfollowed user' });

      // Get feed as testUser
      const feedRes = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(feedRes.status).toBe(200);
      expect(feedRes.body.data.posts).toHaveLength(0);
      expect(feedRes.body.data.pagination.total).toBe(0);
    });
  });
});
