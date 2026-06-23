import { Router } from 'express';
import { authenticateToken, checkBan, createBanChecker, Ban, asyncHandler } from '@breezy/shared';
import { followUser, unfollowUser } from '../controllers/followController';

const router = Router();

const banChecker = createBanChecker(Ban);

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.post('/follow/:id', asyncHandler(followUser));
router.delete('/unfollow/:id', asyncHandler(unfollowUser));

export default router;
