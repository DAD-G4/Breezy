import { Router } from 'express';
import { asyncHandler, validateLoginInput } from '@breezy/shared';
import { register, login, me, logout } from '../controllers/authController';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', validateLoginInput, asyncHandler(login));
router.get('/me', asyncHandler(me));
router.post('/logout', asyncHandler(logout));

export default router;
