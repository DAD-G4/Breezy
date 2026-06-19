import { Router } from 'express';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { getProfile, updateProfile, updateSettings } from '../controllers/userController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.get('/profile/:id', getProfile);
router.put('/profile/:id', updateProfile);
router.put('/settings/:id', updateSettings);

export default router;
