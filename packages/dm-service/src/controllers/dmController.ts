import { Response } from 'express';
import { DirectMessageModel as DirectMessage, success, error, AuthRequest } from '@breezy/shared';

/** Deterministic ID: ensures (A,B) and (B,A) map to the same conversation. */
function generateConversationId(userId1: number, userId2: number): string {
  return `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
}

/** POST /api/dms/send */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { recipient_id, message_text } = req.body;

    if (!recipient_id || typeof recipient_id !== 'number') {
      error(res, 'Recipient ID is required and must be a number', 400);
      return;
    }

    if (!message_text || typeof message_text !== 'string') {
      error(res, 'Message text is required', 400);
      return;
    }

    if (message_text.trim().length === 0) {
      error(res, 'Message text cannot be empty', 400);
      return;
    }

    if (message_text.length > 1000) {
      error(res, 'Message text cannot exceed 1000 characters', 400);
      return;
    }

    const senderId = req.user.id;
    const conversationId = generateConversationId(senderId, recipient_id);

    const dm = await DirectMessage.create({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id,
      message_text,
    });

    success(res, dm, 'Message sent successfully', 201);
  } catch (err) {
    console.error('[SendMessage]', err);
    error(res, 'Internal server error', 500);
  }
}

/** GET /api/dms/conversation/:userId — Query params: ?page=1&limit=50 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
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
  } catch (err) {
    console.error('[GetConversation]', err);
    error(res, 'Internal server error', 500);
  }
}

/** GET /api/dms/conversations — Query params: ?page=1&limit=20 */
export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const distinctConversations = await DirectMessage.distinct('conversation_id', {
      $or: [{ sender_id: userId }, { recipient_id: userId }],
    });

    const total = distinctConversations.length;
    const paginatedIds = distinctConversations.slice(skip, skip + limit);

    const conversations = (await Promise.all(
      paginatedIds.map(async (conversationId) => {
        const lastMessage = await DirectMessage.findOne({ conversation_id: conversationId })
          .sort({ created_at: -1 })
          .limit(1);

        if (!lastMessage) return null;

        const unreadCount = await DirectMessage.countDocuments({
          conversation_id: conversationId,
          recipient_id: userId,
          is_read: false,
        });

        const otherUserId =
          lastMessage.sender_id === userId ? lastMessage.recipient_id : lastMessage.sender_id;

        return {
          conversation_id: conversationId,
          other_user_id: otherUserId,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      }),
    )).filter(Boolean);

    conversations.sort((a, b) => {
      const timeA = a.last_message?.created_at?.getTime?.() ?? 0;
      const timeB = b.last_message?.created_at?.getTime?.() ?? 0;
      return timeB - timeA;
    });

    success(res, {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GetConversations]', err);
    error(res, 'Internal server error', 500);
  }
}

/** GET /api/dms/unread-count */
export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const unreadCount = await DirectMessage.countDocuments({
      recipient_id: req.user.id,
      is_read: false,
    });

    success(res, { unreadCount });
  } catch (err) {
    console.error('[GetUnreadCount]', err);
    error(res, 'Internal server error', 500);
  }
}

/** PUT /api/dms/conversation/:userId/read */
export async function markConversationAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
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
  } catch (err) {
    console.error('[MarkConversationAsRead]', err);
    error(res, 'Internal server error', 500);
  }
}
