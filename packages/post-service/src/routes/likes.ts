import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { toggleLike } from '../controllers/likeController';

const router = Router();

router.use(authenticateToken);

router.post('/:id/like', toggleLike);

export default router;
