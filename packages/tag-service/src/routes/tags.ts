import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker } from '@breezy/shared';
import { searchPostsByTag, getTrending } from '../controllers/tagController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.get('/search', asyncHandler(searchPostsByTag));
router.get('/trending', asyncHandler(getTrending));

export default router;
