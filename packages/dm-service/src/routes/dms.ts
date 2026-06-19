import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker, validateDMContent } from '@breezy/shared';
import { sendMessage, getConversation, getConversations, getUnreadCount, markConversationAsRead } from '../controllers/dmController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/send', validateDMContent, asyncHandler(sendMessage));
router.get('/conversations', asyncHandler(getConversations));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.put('/conversation/:userId/read', asyncHandler(markConversationAsRead));
router.get('/conversation/:userId', asyncHandler(getConversation));

export default router;
