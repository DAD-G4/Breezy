import { Router } from 'express';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { searchPostsByTag } from '../controllers/tagController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.get('/search', searchPostsByTag);

export default router;
