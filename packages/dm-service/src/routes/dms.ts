import { Router } from 'express';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { sendMessage, getConversation, getConversations, getUnreadCount, markConversationAsRead } from '../controllers/dmController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.put('/conversation/:userId/read', markConversationAsRead);
router.get('/conversation/:userId', getConversation);

export default router;
