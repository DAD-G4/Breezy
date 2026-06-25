import { Router } from 'express';
import { authenticateToken, checkBan, createBanChecker, Ban, asyncHandler } from '@breezy/shared';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/blockController';

const router = Router();

const banChecker = createBanChecker(Ban);

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.get('/blocked', asyncHandler(getBlockedUsers));

router.post('/block/:id', asyncHandler(blockUser));
router.delete('/block/:id', asyncHandler(unblockUser));

export default router;
