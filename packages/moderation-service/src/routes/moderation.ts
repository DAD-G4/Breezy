import { Router } from 'express';
import { authenticateToken, requireRole, UserRole } from '@breezy/shared';
import {
  createReport,
  listReports,
  resolveReport,
  createBan,
  deleteBan,
  listBans,
} from '../controllers/moderationController';

const router = Router();

router.post('/report', authenticateToken, createReport);
router.get('/reports', authenticateToken, requireRole(UserRole.MODERATOR), listReports);
router.put('/reports/:id/resolve', authenticateToken, requireRole(UserRole.MODERATOR), resolveReport);

router.post('/ban', authenticateToken, requireRole(UserRole.MODERATOR), createBan);
router.delete('/ban/:userId', authenticateToken, requireRole(UserRole.ADMIN), deleteBan);
router.get('/bans', authenticateToken, requireRole(UserRole.MODERATOR), listBans);

export default router;
