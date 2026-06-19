import { Router } from 'express';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { addComment, replyToComment } from '../controllers/commentController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.post('/:id/comment', addComment);
router.post('/:id/comment/:commentId/reply', replyToComment);

export default router;
