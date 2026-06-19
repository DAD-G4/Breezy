import { Response } from 'express';
import { PostModel as Post, NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

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
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (likeIndex === -1 && userId !== post.user_id) {
      await Notification.create({
        recipient_id: post.user_id,
        sender_id: userId,
        type: 'like',
        post_id: post._id,
        is_read: false,
      });
    }

    success(res, {
      liked: likeIndex === -1,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error('[ToggleLike]', err);
    error(res, 'Internal server error', 500);
  }
}
