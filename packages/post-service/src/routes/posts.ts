import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker, validatePostContent } from '@breezy/shared';
import { createPost, getUserPosts, deletePost, updatePost } from '../controllers/postController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/', validatePostContent, asyncHandler(createPost));
router.get('/user/:id', asyncHandler(getUserPosts));
router.put('/:id', validatePostContent, asyncHandler(updatePost));
router.delete('/:id', asyncHandler(deletePost));

export default router;
