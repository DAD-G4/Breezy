import { Router } from 'express';
import { authenticateToken, checkBan, Ban, asyncHandler, createBanChecker, validateCommentContent } from '@breezy/shared';
import { addComment, replyToComment } from '../controllers/commentController';

const router = Router();

router.use(authenticateToken);
router.use(checkBan(createBanChecker(Ban)));

router.post('/:id/comment', validateCommentContent, asyncHandler(addComment));
router.post('/:id/comment/:commentId/reply', validateCommentContent, asyncHandler(replyToComment));

export default router;
