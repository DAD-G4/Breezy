import { Router } from 'express';
import { asyncHandler, validateLoginInput, authenticateToken, requireRole, UserRole } from '@breezy/shared';
import { register, login, me, logout, refresh, adminRegister } from '../controllers/authController';

const router = Router();

router.post('/register', asyncHandler(register));
// requireRole DOIT être précédé de authenticateToken (sinon req.user est vide → 401).
router.post('/admin/register', authenticateToken, requireRole(UserRole.ADMIN), asyncHandler(adminRegister));
router.post('/login', validateLoginInput, asyncHandler(login));
router.get('/me', asyncHandler(me));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

export default router;
