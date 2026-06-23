import { Router } from 'express';
import { authenticateToken, checkBan, createBanChecker, Ban, asyncHandler } from '@breezy/shared';
import { getProfile, getBatchProfiles, updateProfile, updateSettings } from '../controllers/userController';

const router = Router();

const banChecker = createBanChecker(Ban);

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.get('/profile/:id', asyncHandler(getProfile));
router.post('/batch', asyncHandler(getBatchProfiles));
router.put('/profile/:id', asyncHandler(updateProfile));
router.put('/settings/:id', asyncHandler(updateSettings));

export default router;
