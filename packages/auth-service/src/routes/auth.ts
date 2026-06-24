import { Router } from 'express';
import { asyncHandler, validateLoginInput, requireRole, UserRole } from '@breezy/shared';
import { register, login, me, logout, adminRegister } from '../controllers/authController';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/admin/register', requireRole(UserRole.ADMIN), asyncHandler(adminRegister));
router.post('/login', validateLoginInput, asyncHandler(login));
router.get('/me', asyncHandler(me));
router.post('/logout', asyncHandler(logout));

export default router;
