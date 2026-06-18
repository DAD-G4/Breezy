import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { addComment, replyToComment } from '../controllers/commentController';

const router = Router();

router.use(authenticateToken);

router.post('/:id/comment', addComment);
router.post('/:id/comment/:commentId/reply', replyToComment);

export default router;
