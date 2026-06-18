import { Router } from 'express';
import { searchPostsByTag } from '../controllers/tagController';

const router = Router();

// Public endpoint — no authentication required
router.get('/search', searchPostsByTag);

export default router;
