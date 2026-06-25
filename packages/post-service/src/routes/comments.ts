import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker, validateCommentContent } from '@breezy/shared';
import { addComment, replyToComment, deleteComment } from '../controllers/commentController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/:id/comment', validateCommentContent, asyncHandler(addComment));
router.post('/:id/comment/:commentId/reply', validateCommentContent, asyncHandler(replyToComment));
router.delete('/:id/comment/:commentId', asyncHandler(deleteComment));

export default router;
