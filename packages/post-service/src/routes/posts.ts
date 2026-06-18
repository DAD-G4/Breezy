import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { createPost, getUserPosts, deletePost } from '../controllers/postController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createPost);
router.get('/user/:id', getUserPosts);
router.delete('/:id', deletePost);

export default router;
