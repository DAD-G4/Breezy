import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { getProfile, updateProfile, updateSettings } from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/profile/:id', getProfile);
router.put('/profile/:id', updateProfile);
router.put('/settings/:id', updateSettings);

export default router;
