import bcrypt from 'bcrypt';
import { User as UserModel, Profile as ProfileModel } from '../models/postgres';
import PostModel from '../models/mongodb/Post';
import NotificationModel from '../models/mongodb/Notification';
import DirectMessageModel from '../models/mongodb/DirectMessage';
import ReportModel from '../models/mongodb/Report';

export async function createTestUser(overrides: { email?: string; username?: string; password?: string; role?: string } = {}) {
  const password = overrides.password || 'TestPass123!';
  const user = await UserModel.create({
    email: overrides.email || `test-${Date.now()}@test.com`,
    username: overrides.username || `user-${Date.now()}`,
    password_hash: await bcrypt.hash(password, 10),
    role: (overrides.role || 'user') as 'user' | 'moderator' | 'admin',
  });
  await ProfileModel.create({
    user_id: user.id,
    display_name: overrides.username || user.username,
  });
  return { user, password };
}

export async function createTestPost(userId: number, overrides: { content?: string; tags?: string[] } = {}) {
  return PostModel.create({
    user_id: userId,
    content: overrides.content || 'Test post content',
    tags: overrides.tags || [],
    media: undefined,
  });
}

export async function createTestNotification(recipientId: number, senderId: number, overrides: { type?: string; postId?: string } = {}) {
  return NotificationModel.create({
    recipient_id: recipientId,
    sender_id: senderId,
    type: (overrides.type || 'mention') as 'mention' | 'like' | 'follow',
    post_id: overrides.postId || null,
    is_read: false,
  });
}

export async function createTestDM(senderId: number, recipientId: number, overrides: { text?: string; conversationId?: string } = {}) {
  const conversationId = overrides.conversationId || [senderId, recipientId].sort().join('-');
  return DirectMessageModel.create({
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    message_text: overrides.text || 'Test message',
    is_read: false,
  });
}

export async function createTestReport(reportedBy: number, overrides: { targetType?: string; targetId?: string; reason?: string } = {}) {
  return ReportModel.create({
    reported_by: reportedBy,
    target_type: (overrides.targetType || 'post') as 'post' | 'comment',
    target_id: overrides.targetId || 'test-target-id',
    reason: overrides.reason || 'Test report reason',
    status: 'pending',
  });
}
