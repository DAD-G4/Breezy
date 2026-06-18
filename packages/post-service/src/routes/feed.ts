import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { getFeed } from '../controllers/feedController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getFeed);

export default router;
