import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { toggleLike } from '../controllers/likeController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/:id/like', toggleLike);

export default router;
