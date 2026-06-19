import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker } from '@breezy/shared';
import { getNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.get('/', asyncHandler(getNotifications));
router.put('/:id/read', asyncHandler(markAsRead));

export default router;
