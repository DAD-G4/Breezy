import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { getNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

export default router;
