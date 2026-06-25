import { Router } from 'express';
import { asyncHandler, optionalAuth } from '@breezy/shared';
import { getPostById } from '../controllers/postController';

const router = Router();

// optionalAuth : route publique, mais on lit le viewer pour appliquer le blocage.
router.get('/:id', optionalAuth, asyncHandler(getPostById));

export default router;
