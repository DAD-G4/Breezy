import { Response } from 'express';
import { success, error, AuthRequest } from '@breezy/shared';
import DirectMessage from '@breezy/shared/src/models/mongodb/DirectMessage';

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
