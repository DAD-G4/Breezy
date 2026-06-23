import { Router } from 'express';
import { authenticateToken, checkBan, Ban, requireRole, UserRole, asyncHandler, createBanChecker, validateReportInput, validateBanInput } from '@breezy/shared';
import {
  createReport,
  listReports,
  resolveReport,
  createBan,
  deleteBan,
  listBans,
} from '../controllers/moderationController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/report', validateReportInput, asyncHandler(createReport));
router.get('/reports', requireRole(UserRole.MODERATOR), asyncHandler(listReports));
router.put('/reports/:id/resolve', requireRole(UserRole.MODERATOR), asyncHandler(resolveReport));

router.post('/ban', requireRole(UserRole.MODERATOR), validateBanInput, asyncHandler(createBan));
router.delete('/ban/:userId', requireRole(UserRole.ADMIN), asyncHandler(deleteBan));
router.get('/bans', requireRole(UserRole.MODERATOR), asyncHandler(listBans));

export default router;
