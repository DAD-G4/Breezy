import { Response } from 'express';
import { DirectMessageModel as DirectMessage, NotificationModel, success, error, AuthRequest } from '@breezy/shared';
import type { PipelineStage } from 'mongoose';

/** Deterministic ID: ensures (A,B) and (B,A) map to the same conversation. */
function generateConversationId(userId1: number, userId2: number): string {
  return `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
}

/** POST /api/dms/send */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { recipient_id, message_text } = req.body;

  const senderId = req.user.id;
  const conversationId = generateConversationId(senderId, recipient_id);

  const dm = await DirectMessage.create({
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id,
    message_text,
  });

  await NotificationModel.create({
    recipient_id,
    sender_id: senderId,
    type: 'dm',
    post_id: null,
    is_read: false,
  });

  success(res, dm, 'Message sent successfully', 201);
}

/** GET /api/dms/conversation/:userId — Query params: ?page=1&limit=50 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { userId } = req.params;
  const otherUserId = parseInt(userId, 10);

  if (isNaN(otherUserId)) {
    error(res, 'Invalid user ID', 400);
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
  const skip = (page - 1) * limit;

  const conversationId = generateConversationId(req.user.id, otherUserId);

  const messages = await DirectMessage.find({ conversation_id: conversationId })
    .sort({ created_at: 1 })
    .skip(skip)
    .limit(limit);

  const total = await DirectMessage.countDocuments({ conversation_id: conversationId });

  success(res, {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** GET /api/dms/conversations — Query params: ?page=1&limit=20 */
export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    { $match: { $or: [{ sender_id: userId }, { recipient_id: userId }] } },
    { $sort: { created_at: -1 } },
    {
      $group: {
        _id: '$conversation_id',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient_id', userId] },
                  { $eq: ['$is_read', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await DirectMessage.aggregate(pipeline);

  const conversations = result.data.map((item: any) => {
    const lastMsg = item.lastMessage;
    const otherUserId = lastMsg.sender_id === userId ? lastMsg.recipient_id : lastMsg.sender_id;

    return {
      conversation_id: item._id,
      other_user_id: otherUserId,
      last_message: lastMsg,
      unread_count: item.unreadCount,
    };
  });

  const total = result.total[0]?.count || 0;

  success(res, {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** GET /api/dms/unread-count */
export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const unreadCount = await DirectMessage.countDocuments({
    recipient_id: req.user.id,
    is_read: false,
  });

  success(res, { unreadCount });
}

/** PUT /api/dms/conversation/:userId/read */
export async function markConversationAsRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { userId } = req.params;
  const otherUserId = parseInt(userId, 10);

  if (isNaN(otherUserId)) {
    error(res, 'Invalid user ID', 400);
    return;
  }

  const conversationId = generateConversationId(req.user.id, otherUserId);

  const result = await DirectMessage.updateMany(
    {
      conversation_id: conversationId,
      recipient_id: req.user.id,
      is_read: false,
    },
    { $set: { is_read: true } },
  );

  success(res, { updated: result.modifiedCount });
}
