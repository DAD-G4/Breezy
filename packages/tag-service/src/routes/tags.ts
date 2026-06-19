import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { searchPostsByTag } from '../controllers/tagController';

const router = Router();

router.use(authenticateToken);

router.get('/search', searchPostsByTag);

export default router;
