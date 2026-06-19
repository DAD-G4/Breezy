import { Router } from 'express';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { getFeed } from '../controllers/feedController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

// All routes require authentication
router.use(authenticateToken);
router.use(checkBan(banChecker));

router.get('/', getFeed);

export default router;
