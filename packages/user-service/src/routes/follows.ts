import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { followUser, unfollowUser } from '../controllers/followController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/follow/:id', followUser);
router.delete('/unfollow/:id', unfollowUser);

export default router;
