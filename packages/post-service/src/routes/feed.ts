import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker } from '@breezy/shared';
import { getFeed } from '../controllers/feedController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.get('/', asyncHandler(getFeed));

export default router;
