import { Router } from 'express';
import { asyncHandler, validateLoginInput } from '@breezy/shared';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', validateLoginInput, asyncHandler(login));

export default router;
