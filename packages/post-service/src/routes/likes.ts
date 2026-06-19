import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker } from '@breezy/shared';
import { toggleLike } from '../controllers/likeController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/:id/like', asyncHandler(toggleLike));

export default router;
