import { Router } from 'express';
import { authenticateToken, checkBan, Ban, requireRole, UserRole } from '@breezy/shared';
import {
  createReport,
  listReports,
  resolveReport,
  createBan,
  deleteBan,
  listBans,
} from '../controllers/moderationController';

const router = Router();

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

router.use(authenticateToken);
router.use(checkBan(banChecker));

router.post('/report', createReport);
router.get('/reports', requireRole(UserRole.MODERATOR), listReports);
router.put('/reports/:id/resolve', requireRole(UserRole.MODERATOR), resolveReport);

router.post('/ban', requireRole(UserRole.MODERATOR), createBan);
router.delete('/ban/:userId', requireRole(UserRole.ADMIN), deleteBan);
router.get('/bans', requireRole(UserRole.MODERATOR), listBans);

export default router;
