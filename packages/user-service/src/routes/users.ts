import { Router } from 'express';
import { authenticateToken, checkBan, createBanChecker, Ban, asyncHandler } from '@breezy/shared';
import { getProfile, getBatchProfiles, updateProfile, updateSettings, getFollowers, getFollowing, searchUsers, getSuggestions, ping } from '../controllers/userController';

const router = Router();

const banChecker = createBanChecker(Ban);

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.put('/ping', asyncHandler(ping));
router.get('/search', asyncHandler(searchUsers));
router.get('/suggestions', asyncHandler(getSuggestions));
router.get('/profile/:id', asyncHandler(getProfile));
router.get('/followers/:id', asyncHandler(getFollowers));
router.get('/following/:id', asyncHandler(getFollowing));
router.post('/batch', asyncHandler(getBatchProfiles));
router.put('/profile/:id', asyncHandler(updateProfile));
router.put('/settings/:id', asyncHandler(updateSettings));

export default router;
