import { Router } from 'express';
import { asyncHandler } from '@breezy/shared';
import { getProfileByUsername } from '../controllers/userController';

const router = Router();

router.get('/username/:username', asyncHandler(getProfileByUsername));

export default router;
