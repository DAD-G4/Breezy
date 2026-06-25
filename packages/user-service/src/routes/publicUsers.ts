import { Router } from 'express';
import { asyncHandler, optionalAuth } from '@breezy/shared';
import { getProfileByUsername } from '../controllers/userController';

const router = Router();

// optionalAuth : route publique, mais on lit le viewer (s'il est connecté)
// pour renvoyer is_following.
router.get('/username/:username', optionalAuth, asyncHandler(getProfileByUsername));

export default router;
