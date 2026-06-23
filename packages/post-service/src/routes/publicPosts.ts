import { Router } from 'express';
import { asyncHandler } from '@breezy/shared';
import { getPostById } from '../controllers/postController';

const router = Router();

router.get('/:id', asyncHandler(getPostById));

export default router;
