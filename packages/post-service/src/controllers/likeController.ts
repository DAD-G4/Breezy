import { Response } from 'express';
import Post from '@breezy/shared/src/models/mongodb/Post';
import { success, error, AuthRequest } from '@breezy/shared';

/**
 * POST /api/posts/:id/like
 * Toggle like on a post. If user already liked, remove like (unlike).
 * If user hasn't liked, add like. Returns { liked, likesCount }.
 */
export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      error(res, 'Post not found', 404);
      return;
    }

    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Already liked — unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Not liked — like
      post.likes.push(userId);
    }

    await post.save();

    success(res, {
      liked: likeIndex === -1,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error('[ToggleLike]', err);
    error(res, 'Internal server error', 500);
  }
}
